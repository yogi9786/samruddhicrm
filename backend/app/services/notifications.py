import os
import json
from pywebpush import webpush, WebPushException
from app.core.firebase import db

class NotificationService:
    @staticmethod
    def send_push_notification(title: str, body: str, url: str = "/dashboard/leads"):
        """Send a push notification to all subscribed admin users."""
        vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        vapid_claims = {
            "sub": os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")
        }

        if not vapid_private_key:
            print("VAPID_PRIVATE_KEY not set, skipping push notification.")
            return

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url
        })

        try:
            # Fetch subscriptions from Firestore (assuming 'siriadmin' or all admins)
            # For this simple setup, we'll notify all docs in push_subscriptions
            docs = db.collection("push_subscriptions").stream()
            for doc in docs:
                subs = doc.to_dict().get("subscriptions", [])
                for sub in subs:
                    try:
                        webpush(
                            subscription_info=sub,
                            data=payload,
                            vapid_private_key=vapid_private_key,
                            vapid_claims=vapid_claims
                        )
                    except WebPushException as ex:
                        print("WebPushException:", repr(ex))
                        # If subscription is expired/invalid, we could remove it here
        except Exception as e:
            print("Failed to send push notification:", str(e))
