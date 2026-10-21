

import asyncio
import json
import os
import shutil
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, List

from backend.config import (
    REA_CLI_PATH,
    ENABLE_REA_CLI_EXECUTION,
    UPLOAD_DIR,
)


def is_tool_installed(name: str) -> bool:
    return shutil.which(name) is not None or Path(name).is_file()


def _rea_env() -> Dict[str, str]:
    env = os.environ.copy()
    env["REA_TELEMETRY"] = "false"
    return env


def parse_rea_output(stdout: str) -> Any:
    """Return the final JSON object from REA output."""
    result = None

    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue

        try:
            obj = json.loads(line)
        except ValueError:
            continue

        if "rea_progress" not in obj:
            result = obj

    if result is None:
        try:
            result = json.loads(stdout)
        except ValueError:
            result = None

    return result


async def run_command_async(
    args: List[str],
    timeout: int = 20,
) -> Dict[str, Any]:
    """Execute an argument list without invoking a shell."""
    try:
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=_rea_env(),
        )

        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=timeout,
        )

        return {
            "success": proc.returncode == 0,
            "returncode": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
            "command": args,
        }

    except asyncio.TimeoutError:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": f"Command timed out after {timeout} seconds",
            "command": args,
        }

    except Exception as exc:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": str(exc),
            "command": args,
        }


async def run_jadx_async(
    jadx_path: str,
    apk_path: Path,
    output_dir: Path,
    timeout: int = 180,
) -> Dict[str, Any]:
    """Run JADX, supporting Windows batch files without shell interpolation."""
    command = [
        jadx_path,
        "-d",
        str(output_dir),
        str(apk_path),
    ]

    if (
        sys.platform == "win32"
        and jadx_path.lower().endswith((".bat", ".cmd"))
    ):
        # subprocess list2cmdline safely quotes Windows arguments.
        import subprocess

        command_line = subprocess.list2cmdline(command)

        return await run_command_async(
            [
                os.environ.get("COMSPEC", "cmd.exe"),
                "/d",
                "/s",
                "/c",
                f'"{command_line}"',
            ],
            timeout=timeout,
        )

    return await run_command_async(command, timeout=timeout)


async def inspect_apk_with_jadx(apk_path: Path) -> Dict[str, Any]:
    """Statically inspect an APK using JADX. Never execute the APK."""
    jadx_path = os.getenv("JADX_PATH", "").strip()

    if not jadx_path or not Path(jadx_path).is_file():
        return {
            "status": "unavailable",
            "verified_active": False,
            "tool": "jadx",
            "notice": (
                "JADX was not found. Set JADX_PATH to the full path "
                "of jadx.bat or the JADX executable."
            ),
        }

    # Keep generated files separate from the uploaded APK.
    with tempfile.TemporaryDirectory(prefix="jadx-analysis-") as temp:
        output_dir = Path(temp) / "output"

        result = await run_jadx_async(
            jadx_path,
            apk_path,
            output_dir,
        )

        manifest_path = output_dir / "resources" / "AndroidManifest.xml"
        sources_dir = output_dir / "sources"

        manifest_found = manifest_path.is_file()
        sources_found = sources_dir.is_dir()
        manifest_info: Dict[str, Any] = {}
        findings: List[Dict[str, Any]] = []

        if manifest_found:
            try:
                root = ET.parse(manifest_path).getroot()
                android_ns = "{http://schemas.android.com/apk/res/android}"

                manifest_info = {
                    "package": root.attrib.get("package"),
                    "min_sdk": None,
                    "target_sdk": None,
                    "debuggable": None,
                    "allow_backup": None,
                    "permissions": [],
                }

                for element in root:
                    if element.tag == "uses-sdk":
                        manifest_info["min_sdk"] = element.attrib.get(
                            android_ns + "minSdkVersion"
                        )
                        manifest_info["target_sdk"] = element.attrib.get(
                            android_ns + "targetSdkVersion"
                        )

                    elif element.tag == "uses-permission":
                        permission = element.attrib.get(
                            android_ns + "name"
                        )
                        if permission:
                            manifest_info["permissions"].append(permission)

                application = root.find("application")

                if application is not None:
                    manifest_info["debuggable"] = application.attrib.get(
                        android_ns + "debuggable"
                    )
                    manifest_info["allow_backup"] = application.attrib.get(
                        android_ns + "allowBackup"
                    )

                    if manifest_info["debuggable"] == "true":
                        findings.append({
                            "severity": "high",
                            "title": "Debuggable application",
                            "details": (
                                "The manifest explicitly enables debugging. "
                                "Confirm whether this is a development build "
                                "or a production APK."
                            ),
                        })

                    if manifest_info["allow_backup"] == "true":
                        findings.append({
                            "severity": "review",
                            "title": "Application backup enabled",
                            "details": (
                                "Review backup rules and whether sensitive "
                                "application data may be included."
                            ),
                        })

            except (ET.ParseError, OSError) as exc:
                manifest_info["parse_error"] = str(exc)

        partial_output = manifest_found or sources_found
        success = bool(result["success"] and partial_output)

        if success:
            status_value = "completed"
            notice = "JADX analysis completed."
        elif partial_output:
            status_value = "partial"
            notice = (
                "JADX produced partial output. Review stderr for "
                "decompilation errors."
            )
        else:
            status_value = "failed"
            notice = (
                "JADX did not produce a readable manifest or source directory."
            )

        return {
            "status": status_value,
            "verified_active": success,
            "tool": "jadx",
            "target": apk_path.name,
            "manifest_found": manifest_found,
            "decompiled_sources_found": sources_found,
            "manifest": manifest_info,
            "findings": findings,
            "returncode": result["returncode"],
            "stdout": result["stdout"][-12000:],
            "stderr": result["stderr"][-12000:],
            "notice": notice,
        }


async def run_rea_doctor(probe: bool = False) -> Dict[str, Any]:
    """Report available REA and native-analysis tools."""
    has_local_cli = is_tool_installed(REA_CLI_PATH)
    has_npx = is_tool_installed("npx")
    has_node = is_tool_installed("node")
    jadx_path = os.getenv("JADX_PATH", "").strip()
    has_jadx = bool(jadx_path and Path(jadx_path).is_file())

    cmd = None
    if has_local_cli and has_node:
        cmd = [REA_CLI_PATH, "--version"]

    execution_result = None

    if probe and cmd and ENABLE_REA_CLI_EXECUTION:
        execution_result = await run_command_async(cmd, timeout=45)

    prerequisites = {
        "node_installed": has_node,
        "npx_installed": has_npx,
        "rea_cli_global": has_local_cli,
        "jadx_installed": has_jadx,
        "ghidra_installed": is_tool_installed("ghidra"),
        "hopper_installed": is_tool_installed("hopper"),
        "radare2_installed": is_tool_installed("r2"),
    }

    verified = bool(execution_result and execution_result.get("success"))

    return {
        "verified_active": verified,
        "execution_enabled": ENABLE_REA_CLI_EXECUTION,
        "command_available": bool(cmd),
        "command_attempted": cmd if probe else None,
        "execution": execution_result,
        "prerequisites": prerequisites,
        "capabilities": {
            "javascript_electron_static_analysis": bool(
                has_node and has_local_cli
            ),
            "android_apk_static_analysis": has_jadx,
            "native_binary_decompilation": bool(
                is_tool_installed("ghidra")
                or is_tool_installed("hopper")
                or is_tool_installed("r2")
            ),
        },
        "notice": (
            "REA CLI probe succeeded."
            if verified
            else (
                "REA CLI is not verified active. CLI execution remains "
                "disabled by default."
            )
        ),
        "instructions": (
            "Configure JADX_PATH for Android APK inspection. "
            "REA CLI is used for authorized JavaScript/Electron analysis. "
            "Native binary analysis may require additional compatible tools."
        ),
    }


def get_rea_mcp_config() -> Dict[str, Any]:
    return {
        "mcpServers": {
            "rea": {
                "command": REA_CLI_PATH,
                "args": ["mcp"],
                "env": {"REA_TELEMETRY": "false"},
            }
        }
    }


async def inspect_target_with_rea(
    target_path_or_url: str,
    user_id: str,
    analysis_type: str = "auto",
) -> Dict[str, Any]:
    """Analyze an authorized target within the user's upload directory."""
    raw_target = (target_path_or_url or "").strip()

    if not raw_target:
        return {
            "status": "needs_target",
            "verified_active": False,
            "notice": "Upload a target before analysis.",
        }

    if not user_id or not user_id.strip():
        return {
            "status": "blocked",
            "verified_active": False,
            "notice": "An authenticated user is required for analysis.",
        }

    try:
        resolved = Path(raw_target).expanduser().resolve(strict=True)
        allowed_root = (UPLOAD_DIR / user_id).resolve()

        if (
            resolved == allowed_root
            or not resolved.is_relative_to(allowed_root)
            or not (resolved.is_file() or resolved.is_dir())
        ):
            return {
                "status": "blocked",
                "verified_active": False,
                "notice": (
                    "Targets must be existing files or directories "
                    "inside your own upload directory."
                ),
                "target": raw_target,
            }

    except (OSError, RuntimeError, ValueError):
        return {
            "status": "needs_target",
            "verified_active": False,
            "notice": (
                "The target does not exist on the backend or its path "
                "is invalid. A local computer path is not accessible "
                "to a cloud service."
            ),
            "target": raw_target,
        }

    # APK inspection uses JADX and does not require REA CLI execution.
    # The API endpoint must still enforce its existing approval workflow.
    if resolved.is_file() and resolved.suffix.lower() == ".apk":
        return await inspect_apk_with_jadx(resolved)

    doctor = await run_rea_doctor(probe=False)

    if not ENABLE_REA_CLI_EXECUTION:
        return {
            "status": "disabled",
            "verified_active": False,
            "notice": (
                "REA CLI execution is disabled. Enable it only after "
                "reviewing the hosted environment and approval flow."
            ),
            "doctor": doctor,
            "target": str(resolved),
            "analysis_type": analysis_type,
        }

    if not (
        is_tool_installed(REA_CLI_PATH)
        and is_tool_installed("node")
    ):
        return {
            "status": "unavailable",
            "verified_active": False,
            "notice": "Node.js and the REA CLI are not available.",
            "doctor": doctor,
            "target": str(resolved),
        }

    command = [
        REA_CLI_PATH,
        "analyze-javascript-application",
        str(resolved),
        "--json",
    ]

    result = await run_command_async(command, timeout=180)

    return {
        "status": "executed" if result["success"] else "failed",
        "verified_active": result["success"],
        "analysis": parse_rea_output(result["stdout"]),
        "cli_output": result["stdout"][-20000:],
        "stderr": result["stderr"],
        "doctor": doctor,
        "target": str(resolved),
        "analysis_type": analysis_type,
    }
