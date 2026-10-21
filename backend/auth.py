"""
Supabase access-token validation for FastAPI.

Tokens are validated by Supabase Auth itself. Do not trust unverified JWT
payloads or user IDs supplied by the browser.
"""
from typing import Optional

import httpx
from fastapi import Header, HTTPException, status

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


async def get_optional_user_id(
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1].strip()
    if not token or token.lower() in {"null", "undefined"}:
        return None

    # Fail closed when the backend is not configured for real token validation.
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {token}",
                },
            )
        if response.status_code != 200:
            return None
        user = response.json()
        user_id = user.get("id")
        return str(user_id) if user_id else None
    except (httpx.HTTPError, ValueError):
        return None


async def get_required_user_id(
    authorization: Optional[str] = Header(None),
) -> str:
    user_id = await get_optional_user_id(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Sign in with Supabase and configure backend credentials.",
        )
    return user_id
