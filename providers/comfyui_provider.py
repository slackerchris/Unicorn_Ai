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
        **kwargs
    ) -> bytes:
        """Generate image using ComfyUI API"""
        
        logger.info(f"=== ComfyUI Image Generation Request ===")
        logger.info(f"Full Positive Prompt: {prompt}")
        logger.info(f"Full Negative Prompt: {negative_prompt}")
        logger.info(f"Dimensions: {width}x{height}")
        
        # Unload Ollama models to free VRAM for image generation
        await self._unload_ollama()
        
        # Load workflow template (API format)
        with open(self.workflow_path, 'r') as f:
            workflow = json.load(f)
        
        # Modify workflow with prompt and settings
        workflow = self._inject_prompt(workflow, prompt, negative_prompt, width, height)
        
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
        height: int
    ) -> Dict[str, Any]:
        """Inject prompt and settings into SDXL API workflow"""
        
        # For sdxl_Character_profile_api.json workflow:
        # Node 6 = BASE Positive Prompt (CLIPTextEncode)
        # Node 7 = BASE Negative Prompt (CLIPTextEncode)
        # Node 15 = REFINER Positive Prompt (CLIPTextEncode)
        # Node 16 = REFINER Negative Prompt (CLIPTextEncode)
        # Node 5 = EmptyLatentImage (for dimensions)
        
        # Set positive prompts (both BASE and REFINER)
        if "6" in workflow:
            workflow["6"]["inputs"]["text"] = prompt
            logger.debug(f"✓ Injected BASE positive prompt (Node 6)")
        
        if "15" in workflow:
            workflow["15"]["inputs"]["text"] = prompt
            logger.debug(f"✓ Injected REFINER positive prompt (Node 15)")
        
        # Set negative prompts (both BASE and REFINER)
        if negative_prompt:
            if "7" in workflow:
                workflow["7"]["inputs"]["text"] = negative_prompt
                logger.debug(f"✓ Injected BASE negative prompt (Node 7)")
            
            if "16" in workflow:
                workflow["16"]["inputs"]["text"] = negative_prompt
                logger.debug(f"✓ Injected REFINER negative prompt (Node 16)")
        
        # Set image dimensions
        if "5" in workflow:
            workflow["5"]["inputs"]["width"] = width
            workflow["5"]["inputs"]["height"] = height
            logger.debug(f"Set dimensions: {width}x{height}")
        
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
