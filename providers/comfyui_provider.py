"""
ComfyUI Provider - Uses local ComfyUI installation
Fully self-hosted, private, free (after setup)
Requires ComfyUI running on localhost:8188
"""

import os
import httpx
import json
import uuid
import asyncio
from typing import Optional, Dict, Any
from loguru import logger
from .base_provider import ImageProvider


class ComfyUIProvider(ImageProvider):
    """Image generation using local ComfyUI"""
    
    def __init__(self):
        self.base_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
        self.workflow_path = os.getenv(
            "COMFYUI_WORKFLOW",
            "workflows/sdxl_Character_profile_api.json"
        )
        self.reference_image = os.getenv(
            "REFERENCE_IMAGE",
            "reference_images/luna_face.png"
        )
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 512,
        height: int = 512,
        workflow_path: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """Generate image using ComfyUI API"""
        
        logger.info(f"=== ComfyUI Image Generation Request ===")
        logger.info(f"Full Positive Prompt: {prompt}")
        logger.info(f"Full Negative Prompt: {negative_prompt}")
        logger.info(f"Dimensions: {width}x{height}")
        
        # Check if ComfyUI is available
        if not await self.is_available():
            error_msg = "ComfyUI is not running or not accessible. Please start ComfyUI first."
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info("✓ ComfyUI health check passed")
        
        # Unload Ollama models to free VRAM for image generation
        await self._unload_ollama()
        
        # Load workflow template (API format)
        # Use provided workflow path or default
        current_workflow_path = workflow_path or self.workflow_path
        with open(current_workflow_path, 'r') as f:
            workflow = json.load(f)
        
        logger.info(f"Using workflow: {current_workflow_path}")
        
        # Modify workflow with prompt and settings
        persona_name = kwargs.get("persona_name", "unknown")
        workflow = self._inject_prompt(workflow, prompt, negative_prompt, width, height, persona_name)
        
        # Save complete workflow to file for debugging (optional)
        debug_mode = os.getenv("COMFYUI_DEBUG", "false").lower() == "true"
        if debug_mode:
            debug_path = "outputs/logs/comfyui_last_workflow.json"
            with open(debug_path, 'w') as f:
                json.dump(workflow, f, indent=2)
            logger.info(f"Debug: Saved complete workflow to {debug_path}")
        
        # Generate unique client ID
        client_id = str(uuid.uuid4())
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Queue the workflow
            response = await client.post(
                f"{self.base_url}/prompt",
                json={
                    "prompt": workflow,
                    "client_id": client_id
                }
            )
            response.raise_for_status()
            result = response.json()
            prompt_id = result["prompt_id"]
            
            logger.info(f"ComfyUI prompt queued: {prompt_id}")
            
            # Wait for completion and get image
            return await self._wait_for_image(client, prompt_id)
    
    def _convert_workflow_format(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ComfyUI UI format to API format"""
        # If it has a 'nodes' key, it's the UI format - need to convert
        if "nodes" in workflow_data:
            api_workflow = {}
            for node in workflow_data["nodes"]:
                node_id = str(node["id"])
                api_workflow[node_id] = {
                    "inputs": node.get("inputs", {}),
                    "class_type": node["type"],
                    "_meta": {
                        "title": node.get("title", "")
                    }
                }
                # Convert widgets_values to inputs
                if "widgets_values" in node:
                    api_workflow[node_id]["widgets_values"] = node["widgets_values"]
            
            logger.debug(f"Converted UI workflow with {len(api_workflow)} nodes")
            return api_workflow
        
        # Already in API format
        return workflow_data
    
    def _inject_prompt(
        self,
        workflow: Dict[str, Any],
        prompt: str,
        negative_prompt: Optional[str],
        width: int,
        height: int,
        persona_name: str = "unknown"
    ) -> Dict[str, Any]:
        """Inject prompt and settings into workflow - works with both standard and InstantID workflows"""
        
        # Replace persona name placeholders throughout the workflow
        workflow_str = json.dumps(workflow)
        workflow_str = workflow_str.replace("PERSONA_NAME", persona_name)
        workflow = json.loads(workflow_str)
        
        # Find and inject positive prompts
        positive_nodes = []
        negative_nodes = []
        dimension_nodes = []
        
        for node_id, node_data in workflow.items():
            class_type = node_data.get("class_type", "")
            meta_title = node_data.get("_meta", {}).get("title", "").lower()
            
            # Find positive prompt nodes
            if class_type == "CLIPTextEncode":
                if "positive" in meta_title or (
                    "inputs" in node_data and 
                    node_data["inputs"].get("text") in ["PROMPT_TEXT", ""] or
                    "positive" in str(node_data["inputs"].get("text", "")).lower()
                ):
                    positive_nodes.append(node_id)
                elif "negative" in meta_title or (
                    "inputs" in node_data and
                    "negative" in str(node_data["inputs"].get("text", "")).lower()
                ):
                    negative_nodes.append(node_id)
            
            # Find dimension nodes
            elif class_type == "EmptyLatentImage":
                dimension_nodes.append(node_id)
        
        # Inject positive prompts
        for node_id in positive_nodes:
            workflow[node_id]["inputs"]["text"] = prompt
            logger.debug(f"✓ Injected positive prompt into node {node_id}")
        
        # Inject negative prompts
        if negative_prompt:
            for node_id in negative_nodes:
                workflow[node_id]["inputs"]["text"] = negative_prompt
                logger.debug(f"✓ Injected negative prompt into node {node_id}")
        
        # Set dimensions
        for node_id in dimension_nodes:
            workflow[node_id]["inputs"]["width"] = width
            workflow[node_id]["inputs"]["height"] = height
            logger.debug(f"✓ Set dimensions {width}x{height} in node {node_id}")
        
        return workflow
    
    async def _wait_for_image(self, client: httpx.AsyncClient, prompt_id: str) -> bytes:
        """Wait for ComfyUI to finish and retrieve the image"""
        
        max_attempts = 300  # 5 minutes max (CPU generation can take 3+ minutes)
        
        for attempt in range(max_attempts):
            await asyncio.sleep(1)
            
            # Check history
            response = await client.get(f"{self.base_url}/history/{prompt_id}")
            response.raise_for_status()
            history = response.json()
            
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                
                # Find the image output
                for node_id, output in outputs.items():
                    if "images" in output:
                        image_info = output["images"][0]
                        filename = image_info["filename"]
                        subfolder = image_info.get("subfolder", "")
                        
                        # Download the image
                        params = {
                            "filename": filename,
                            "subfolder": subfolder,
                            "type": "output"
                        }
                        
                        img_response = await client.get(
                            f"{self.base_url}/view",
                            params=params
                        )
                        img_response.raise_for_status()
                        
                        logger.info(f"ComfyUI image retrieved: {filename}")
                        return img_response.content
        
        raise TimeoutError("ComfyUI generation timed out")
    
    async def is_available(self) -> bool:
        """Check if ComfyUI is running and accessible"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/system_stats")
                return response.status_code == 200
        except Exception:
            return False
    
    async def _unload_ollama(self):
        """Unload Ollama models to free VRAM"""
        try:
            logger.info("Unloading Ollama models to free VRAM...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Ollama API to unload all models
                response = await client.post(
                    "http://localhost:11434/api/generate",
                    json={"model": "", "keep_alive": 0}
                )
                logger.info("Ollama models unloaded")
        except Exception as e:
            logger.warning(f"Could not unload Ollama: {e}")
    
    def get_name(self) -> str:
        return "ComfyUI (Local)"
