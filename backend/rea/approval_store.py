
"""Server-side storage for user-specific, single-use REA approvals."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

TABLE = "darshan_ai_action_approvals"


def _url() -> str:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase server credentials are not configured.")
    return f"{SUPABASE_URL.rstrip('/')}/rest/v1/{TABLE}"


def _headers(prefer: str = "return=representation") -> Dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


async def create_pending_approval(
    user_id: str,
    action_type: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """Create an approval bound to one authenticated user and exact parameters."""
    action_id = str(uuid.uuid4())
    row = {
        "action_id": action_id,
        "user_id": user_id,
        "action_type": action_type,
        "parameters": parameters,
        "status": "pending",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            _url(),
            headers=_headers(),
            json=row,
        )

    response.raise_for_status()
    rows = response.json()
    if not rows:
        raise RuntimeError("Supabase did not return the created approval.")

    return rows[0]


async def update_pending_approval(
    user_id: str,
    action_id: str,
    decision: str,
) -> Optional[Dict[str, Any]]:
    """Approve or reject only a still-pending action owned by this user."""
    if decision not in {"approved", "rejected"}:
        raise ValueError("Decision must be approved or rejected.")

    try:
        action_uuid = str(uuid.UUID(action_id))
    except (ValueError, TypeError, AttributeError):
        return None

    patch: Dict[str, Any] = {"status": decision}
    if decision == "approved":
        patch["approved_at"] = datetime.now(timezone.utc).isoformat()

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            _url(),
            params={
                "action_id": f"eq.{action_uuid}",
                "user_id": f"eq.{user_id}",
                "status": "eq.pending",
                "expires_at": f"gt.{datetime.now(timezone.utc).isoformat()}",
            },
            headers=_headers(),
            json=patch,
        )

    response.raise_for_status()
    rows = response.json()
    return rows[0] if rows else None


async def consume_approved_action(
    user_id: str,
    action_id: str,
) -> Optional[Dict[str, Any]]:
    """Atomically consume an approved, unexpired action once."""
    try:
        action_uuid = str(uuid.UUID(action_id))
    except (ValueError, TypeError, AttributeError):
        return None

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            _url(),
            params={
                "action_id": f"eq.{action_uuid}",
                "user_id": f"eq.{user_id}",
                "status": "eq.approved",
                "expires_at": f"gt.{datetime.now(timezone.utc).isoformat()}",
            },
            headers=_headers(),
            json={
                "status": "consumed",
                "consumed_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    response.raise_for_status()
    rows = response.json()
    return rows[0] if rows else None
