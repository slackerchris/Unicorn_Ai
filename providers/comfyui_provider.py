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
            "workflows/character_generation.json"
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
        
        logger.info(f"Generating image with ComfyUI: {prompt[:50]}...")
        
        # Load workflow template
        with open(self.workflow_path, 'r') as f:
            workflow = json.load(f)
        
        # Modify workflow with prompt and settings
        # (This will vary based on your specific workflow)
        # For now, simplified version
        workflow = self._inject_prompt(workflow, prompt, negative_prompt, width, height)
        
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
    
    def _inject_prompt(
        self,
        workflow: Dict[str, Any],
        prompt: str,
        negative_prompt: Optional[str],
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """Inject prompt and settings into workflow"""
        # This is a placeholder - actual implementation depends on your workflow
        # You'll need to find the right node IDs in your workflow JSON
        
        # Example: Find the text prompt nodes
        for node_id, node in workflow.items():
            if node.get("class_type") == "CLIPTextEncode":
                if "positive" in node.get("_meta", {}).get("title", "").lower():
                    node["inputs"]["text"] = prompt
                elif "negative" in node.get("_meta", {}).get("title", "").lower():
                    if negative_prompt:
                        node["inputs"]["text"] = negative_prompt
        
        return workflow
    
    async def _wait_for_image(self, client: httpx.AsyncClient, prompt_id: str) -> bytes:
        """Wait for ComfyUI to finish and retrieve the image"""
        
        max_attempts = 120  # 2 minutes max
        
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
    
    def get_name(self) -> str:
        return "ComfyUI (Local)"
