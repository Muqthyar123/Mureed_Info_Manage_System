import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.services.email_service import send_brevo_email

settings = get_settings()
print("BREVO API KEY present:", bool(settings.brevo_api_key))
print("BREVO SENDER MAIL:", settings.brevo_sender_mail)

result = send_brevo_email(
    to_email=settings.brevo_sender_mail,
    to_name="MIMS Administrator Test",
    subject="MIMS Brevo Integration Live Test",
    html_content="<h1>MIMS Brevo API Test</h1><p>Brevo transactional email integration is operational.</p>",
)

print("Brevo live email result:", "SUCCESS" if result else "FAILED")
