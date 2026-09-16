import os
import httpx

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Hangsy <onboarding@resend.dev>")


def send_email(to: str, subject: str, html: str) -> None:
    """
    Sends an email via Resend's HTTP API if RESEND_API_KEY is set.
    Otherwise, prints it to the console — so registration/verification still
    works end-to-end in local dev without signing up for an email provider.
    """
    if not RESEND_API_KEY:
        print(f"\n--- [dev] would send email to {to} ---")
        print(f"Subject: {subject}")
        print(html)
        print("--- (set RESEND_API_KEY in .env to actually send this) ---\n")
        return

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        json={
            "from": EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        },
        timeout=10.0,
    )
    response.raise_for_status()
