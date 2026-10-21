"""
Creative Application Tools and Automation Module.
Integrates creative workflows via documented CLI and MCP interfaces (Figma, FFmpeg, Blender, SVG).
"""
from html import escape
from typing import Dict, Any, List
from typing import Dict, Any, List


class CreativeToolsManager:
    """Orchestrates creative automation tools with security restrictions."""

    @staticmethod
    def get_supported_tools() -> List[Dict[str, Any]]:
        """Returns catalogue of authorized creative tools."""
        return [
            {
                "id": "creative-svg-generator",
                "name": "Vector SVG Generator",
                "category": "Design & Illustration",
                "description": "Generates clean, scalable SVG graphics, technical diagrams, and icons",
                "interface": "In-process vector renderer",
                "status": "ready"
            },
            {
                "id": "creative-ffmpeg-cli",
                "name": "FFmpeg Media Automator",
                "category": "Video & Audio",
                "description": "Validates and synthesizes verified CLI recipes for media transcoding, clipping, and audio extraction",
                "interface": "CLI (ffmpeg)",
                "status": "ready"
            },
            {
                "id": "creative-blender-python",
                "name": "Blender Python Headless Scripting",
                "category": "3D & Motion",
                "description": "Generates headless Python scripts for Blender 3D procedural meshes, camera staging, and lighting",
                "interface": "CLI (blender --background --python)",
                "status": "ready"
            },
            {
                "id": "creative-figma-mcp",
                "name": "Figma MCP Bridge",
                "category": "UI/UX Design",
                "description": "Connects to Figma REST API and Figma Model Context Protocol server for design tokens and component inspection",
                "interface": "MCP Server / REST",
                "status": "configured"
            }
        ]

    @staticmethod
    def generate_svg_asset(prompt: str, width: int = 400, height: int = 400) -> str:
        """Procedurally builds a clean SVG graphic based on description."""
        # Only the label changes; escape it so user text cannot inject markup.
        label = escape((prompt or "").strip()[:28] or "Darshan AI")
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" fill="none">\n'
            f'  <defs>\n'
            f'    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">\n'
            f'      <stop offset="0%" stop-color="#06b6d4" />\n'
            f'      <stop offset="100%" stop-color="#3b82f6" />\n'
            f'    </linearGradient>\n'
            f'  </defs>\n'
            f'  <rect width="{width}" height="{height}" rx="16" fill="#171717" stroke="#262626" stroke-width="2" />\n'
            f'  <circle cx="{width//2}" cy="{height//2}" r="{min(width, height)//4}" stroke="url(#cyanGrad)" stroke-width="4" stroke-dasharray="8 6" />\n'
            f'  <text x="{width//2}" y="{height//2 + 6}" fill="#f5f5f5" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">{label}</text>\n'
            f'</svg>'
        )

    @staticmethod
    def generate_blender_script(object_name: str = "DarshanPillar") -> str:
        """Generates executable Blender headless Python script."""
        return (
            "import bpy\n\n"
            "# Clear default scene objects\n"
            "bpy.ops.object.select_all(action='SELECT')\n"
            "bpy.ops.object.delete()\n\n"
            "# Procedural mesh generation\n"
            f"bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=3.5, location=(0, 0, 1.75))\n"
            f"obj = bpy.context.active_object\n"
            f"obj.name = '{object_name}'\n\n"
            "# Create metallic emission material\n"
            "mat = bpy.data.materials.new(name='CyanGlow')\n"
            "mat.use_nodes = True\n"
            "nodes = mat.node_tree.nodes\n"
            "principled = nodes.get('Principled BSDF')\n"
            "principled.inputs['Base Color'].default_value = (0.02, 0.71, 0.83, 1.0)\n"
            "principled.inputs['Metallic'].default_value = 0.9\n"
            "obj.data.materials.append(mat)\n\n"
            "print('Darshan AI Blender script executed successfully.')\n"
        )
