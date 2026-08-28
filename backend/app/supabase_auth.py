from typing import Any

import httpx
from fastapi import HTTPException, status

from .config import Settings


class SupabaseAuthClient:
    def __init__(self, settings: Settings):
        settings.require_supabase()
        self.settings = settings
        self.base_url = settings.supabase_url.rstrip("/")

    def _headers(self, *, service_role: bool = False, access_token: str | None = None) -> dict[str, str]:
        api_key = self.settings.supabase_service_role_key if service_role else self.settings.supabase_anon_key
        headers = {"apikey": api_key, "Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        elif service_role:
            headers["Authorization"] = f"Bearer {api_key}"
        return headers

    def sign_in_with_password(self, email: str, password: str) -> dict[str, Any]:
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            response = client.post(
                f"{self.base_url}/auth/v1/token?grant_type=password",
                headers=self._headers(),
                json={"email": email, "password": password},
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail="Invalid email or password.")
            return response.json()

    def sign_up_with_password(self, email: str, password: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            response = client.post(
                f"{self.base_url}/auth/v1/signup",
                headers=self._headers(),
                json={"email": email, "password": password, "data": data or {}},
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail="Could not create Supabase Auth user.")
            return response.json()

    def get_user(self, access_token: str) -> dict[str, Any]:
        try:
            with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
                response = client.get(
                    f"{self.base_url}/auth/v1/user",
                    headers=self._headers(access_token=access_token),
                )
                if response.status_code >= 400:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired Supabase token.")
                return response.json()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired Supabase token.") from exc

    def verify_otp(self, email: str, token: str, type: str = "signup") -> dict[str, Any]:
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            response = client.post(
                f"{self.base_url}/auth/v1/verify",
                headers=self._headers(),
                json={"type": type, "email": email, "token": token},
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again.")
            return response.json()

    def resend_otp(self, email: str, type: str = "signup") -> dict[str, Any]:
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            response = client.post(
                f"{self.base_url}/auth/v1/resend",
                headers=self._headers(),
                json={"type": type, "email": email},
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail="Could not resend OTP.")
            return response.json()

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        if not self.settings.supabase_service_role_key:
            return None
        try:
            with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
                response = client.get(
                    f"{self.base_url}/auth/v1/admin/users",
                    headers=self._headers(service_role=True),
                )
                if response.status_code == 200:
                    users = response.json().get("users", [])
                    for u in users:
                        if u.get("email", "").lower() == email.strip().lower():
                            return u
        except Exception:
            pass
        return None

    def update_user_password(self, user_id: str, password: str) -> None:
        if not self.settings.supabase_service_role_key:
            raise HTTPException(status_code=500, detail="Supabase service role key is not configured.")
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            response = client.put(
                f"{self.base_url}/auth/v1/admin/users/{user_id}",
                headers=self._headers(service_role=True),
                json={"password": password, "email_confirm": True},
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail="Could not update Supabase Auth password.")

    def ensure_supabase_user_synced(self, email: str, password: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.settings.supabase_service_role_key:
            return self.sign_in_with_password(email, password)
        sp_user = self.get_user_by_email(email)
        with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
            if sp_user and sp_user.get("id"):
                sp_id = sp_user["id"]
                client.put(
                    f"{self.base_url}/auth/v1/admin/users/{sp_id}",
                    headers=self._headers(service_role=True),
                    json={"password": password, "email_confirm": True},
                )
            else:
                client.post(
                    f"{self.base_url}/auth/v1/admin/users",
                    headers=self._headers(service_role=True),
                    json={"email": email, "password": password, "email_confirm": True, "user_metadata": metadata or {}},
                )
        return self.sign_in_with_password(email, password)

    def invite_user(self, email: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.settings.supabase_service_role_key:
            raise HTTPException(status_code=500, detail="Supabase service role key is not configured.")
        response = httpx.post(
            f"{self.base_url}/auth/v1/invite",
            headers=self._headers(service_role=True),
            json={"email": email, "data": data or {}, "redirect_to": f"{self.settings.frontend_url.rstrip('/')}/setup-account"},
            timeout=15,
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=400, detail="Could not send Supabase setup email.")
        return response.json()

    def delete_user(self, user_id: str) -> None:
        if not self.settings.supabase_service_role_key:
            return
        try:
            with httpx.Client(transport=httpx.HTTPTransport(), timeout=15.0) as client:
                client.delete(
                    f"{self.base_url}/auth/v1/admin/users/{user_id}",
                    headers=self._headers(service_role=True),
                )
        except Exception:
            pass

