import logging
import httpx
from ..config import get_settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_brevo_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """
    Sends a transactional email using Brevo's REST API.
    Returns True if sent successfully, False otherwise.
    Never exposes API keys or credentials in logs or exceptions.
    """
    settings = get_settings()
    api_key = settings.brevo_api_key.strip()
    sender_email = settings.brevo_sender_mail.strip()

    if not api_key or not sender_email:
        logger.warning("Brevo email API key or sender email is missing. Email skipped for %s", to_email)
        return False

    payload = {
        "sender": {"name": "MIMS System", "email": sender_email},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(BREVO_API_URL, headers=headers, json=payload)
            if response.status_code in (200, 201, 202):
                logger.info("Brevo email successfully dispatched to %s", to_email)
                return True
            else:
                logger.error("Brevo API error (%d) for %s: %s", response.status_code, to_email, response.text)
                return False
    except Exception as exc:
        logger.error("Exception during Brevo email dispatch to %s: %s", to_email, exc)
        return False


def send_mureed_welcome_email(email: str, name: str, initial_password: str | None = None, login_url: str = "http://localhost:8081/mureed-login") -> bool:
    subject = "Welcome to MIMS - Account Details & Instructions"
    pw_html = ""
    if initial_password:
        pw_html = f"""
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Initial Temporary Password:</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; font-family: monospace; color: #111827;">{initial_password}</p>
        </div>
        <p style="color: #dc2626; font-size: 13px;"><strong>Security Note:</strong> You will be required to change this default password upon your first login.</p>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Welcome to Mureed Information Management System</h2>
            <p>Dear <strong>{name}</strong>,</p>
            <p>Your Mureed account has been successfully created.</p>
            {pw_html}
            <p>You can access your account details and view your record at any time using the link below:</p>
            <p style="margin: 24px 0;">
                <a href="{login_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Log In to MIMS Portal</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">If you have any questions, please contact your System Administrator.</p>
        </div>
    </body>
    </html>
    """
    return send_brevo_email(email, name, subject, html)


def send_password_reset_email(email: str, name: str, reset_url: str) -> bool:
    subject = "Reset Your MIMS Account Password"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
            <p>Hello <strong>{name or email}</strong>,</p>
            <p>We received a request to reset your password for your Mureed Information Management System (MIMS) account.</p>
            <p>Click the button below to set a new password:</p>
            <p style="margin: 24px 0;">
                <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </p>
            <p style="font-size: 13px; color: #4b5563;">Or copy and paste this URL into your browser:<br><code>{reset_url}</code></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">If you did not request a password reset, please ignore this email.</p>
        </div>
    </body>
    </html>
    """
    return send_brevo_email(email, name, subject, html)


def send_sub_admin_signup_notification(email: str, name: str) -> bool:
    subject = "Sub Admin Application Received - Pending Approval"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Application Received</h2>
            <p>Dear <strong>{name}</strong>,</p>
            <p>Thank you for registering for a Sub Admin account on the Mureed Information Management System (MIMS).</p>
            <p>Your application is currently <strong>PENDING</strong> approval by the Super Admin. You will receive an email update once your account access has been reviewed.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">MIMS Administration System</p>
        </div>
    </body>
    </html>
    """
    return send_brevo_email(email, name, subject, html)


def send_sub_admin_approval_notification(email: str, name: str, login_url: str = "http://localhost:8081/sub-admin-login") -> bool:
    subject = "Sub Admin Account Approved - MIMS"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #15803d; margin-top: 0;">Account Approved</h2>
            <p>Dear <strong>{name}</strong>,</p>
            <p>Great news! Your Sub Admin account for MIMS has been <strong>APPROVED</strong> by the Super Admin.</p>
            <p>You can now log in to the Sub Admin portal:</p>
            <p style="margin: 24px 0;">
                <a href="{login_url}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Log In to Sub Admin Portal</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">MIMS Administration System</p>
        </div>
    </body>
    </html>
    """
    return send_brevo_email(email, name, subject, html)


def send_sub_admin_rejection_notification(email: str, name: str) -> bool:
    subject = "Sub Admin Application Status Update - MIMS"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #dc2626; margin-top: 0;">Application Status Update</h2>
            <p>Dear <strong>{name}</strong>,</p>
            <p>Your application for a Sub Admin account on MIMS was reviewed, but could not be approved at this time.</p>
            <p>If you believe this is an error, please contact the Super Admin.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">MIMS Administration System</p>
        </div>
    </body>
    </html>
    """
    return send_brevo_email(email, name, subject, html)
