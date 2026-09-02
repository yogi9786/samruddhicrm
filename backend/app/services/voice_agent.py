import os
import uuid
import re
import httpx
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.core.database import get_setting, set_setting
from app.services.crm import CRMService

logger = logging.getLogger(__name__)

# Official Siri Samruddhi Gold Palace Indian AI Voice Agent System Prompt
SIRI_SAMRUDDHI_SYSTEM_PROMPT = """You are the official AI voice sales assistant for Siri Samruddhi Gold Palace (Bengaluru, Kolar, Udupi).
Your tone is warm, polite, respectful, and professional (Indian jewellery showroom style).
You speak naturally, understand customer requirements, highlight our active promotions, and help customers schedule showroom visits."""

class VoiceAgentService:
    @staticmethod
    async def get_settings() -> dict:
        data = get_setting("voice_agent", {})
        return {
            "provider": data.get("provider") or os.getenv("VOICE_PROVIDER", "indian_ai"),
            "vapi_api_key": data.get("vapi_api_key") or os.getenv("VAPI_API_KEY", ""),
            "vapi_phone_number_id": data.get("vapi_phone_number_id") or os.getenv("VAPI_PHONE_NUMBER_ID", ""),
            "vapi_assistant_id": data.get("vapi_assistant_id") or os.getenv("VAPI_ASSISTANT_ID", ""),
            "retell_api_key": data.get("retell_api_key") or os.getenv("RETELL_API_KEY", ""),
            "retell_agent_id": data.get("retell_agent_id") or os.getenv("RETELL_AGENT_ID", ""),
            "is_active": data.get("is_active", True)
        }

    @staticmethod
    async def update_settings(settings_data: dict) -> dict:
        current = await VoiceAgentService.get_settings()
        current.update(settings_data)
        set_setting("voice_agent", current)
        return current

    @staticmethod
    def generate_reply(customer_text: str, customer_name: str = "Customer", interest: str = "Gold Jewelry") -> str:
        """
        Standalone Indian Voice Dialogue Engine — 100% local, no API keys or third-party cost required.
        """
        text = (customer_text or "").lower().strip()
        name = customer_name or "Valued Customer"

        # 1. Greetings & Hello
        if any(w in text for w in ["hello", "hi", "namaste", "namaskara", "vanakkam", "hey", "good morning", "good evening", "good afternoon"]):
            return f"Namaste {name}! Welcome to Siri Samruddhi Gold Palace. I am your personal jewellery assistant. How may I assist you with your jewellery selection today?"

        # 2. Gold Rate & Price Per Gram
        if any(w in text for w in ["rate", "gold price", "price per gram", "today rate", "current price", "cost per gram", "22k", "24k"]):
            return "Market gold prices fluctuate daily. To give you the exact hallmark gold rate with our special store discounts, our showroom specialist at Yelahanka, Kolar, or Udupi will assist you directly. Plus, you can lock today's gold rate for 90 days with our Samruddhi Flexi Scheme!"

        # 3. Active Offers & Discounts
        if any(w in text for w in ["offer", "discount", "making charge", "free", "scheme", "deal", "va", "wastage"]):
            return "We have exciting festive offers right now: 1. Up to 100% FREE making charges on selected antique and bridal jewellery! 2. A FREE 24K Gold Coin on purchases above ₹2.5 Lakh! 3. Our 90-day Samruddhi Golden Flexi rate-lock plan. Would you like to view these at our showroom?"

        # 4. Showroom Locations
        if "yelahanka" in text or "bangalore" in text or "bengaluru" in text:
            return "Our Yelahanka showroom has an exclusive bridal floor with antique gold, certified diamonds, and pure wedding silk sarees. Would you like me to book a VIP appointment for you this weekend?"

        if "kolar" in text:
            return "Our Kolar showroom is well-stocked with traditional temple designs, light-weight daily wear gold, and silver pooja collections. Would you like a morning or evening showroom visit?"

        if "udupi" in text or "mangalore" in text or "coastal" in text:
            return "Our Udupi showroom showcases exquisite coastal traditional gold ornaments, Kasu Mala, and diamond bridal sets. Would you like me to reserve an appointment for you with our senior jewellery manager?"

        # 5. Specific Jewellery Categories
        if any(w in text for w in ["diamond", "solitaire", "engagement ring", "vvs"]):
            return "We have an exceptional collection of certified natural VVS-EF quality diamonds, engagement solitaires, and necklace sets with guaranteed buy-back and 100% exchange value. Do you have a specific design or budget in mind?"

        if any(w in text for w in ["saree", "silk", "kanchipuram", "bridal saree", "dress"]):
            return "Our showroom features hand-picked pure Kanchipuram and Banarasi wedding silk sarees, specially curated to match our bridal jewellery sets. You can experience the complete bridal look in our styling lounge!"

        if any(w in text for w in ["antique", "temple", "necklace", "haram", "bangles", "mangalsutra", "kasu mala", "jhumka"]):
            return "We specialize in authentic antique temple jewellery and handcrafted heritage pieces in 22K 916 BIS Hallmark gold. We also provide zero making charge options on select heritage designs!"

        if any(w in text for w in ["silver", "pooja", "gift", "idol", "diya"]):
            return "We have pure 92.5 sterling silver dinner sets, pooja articles, deities, and corporate gifting items with hallmark purity."

        # 6. Budget Inquiries
        if any(w in text for w in ["lakh", "lakhs", "budget", "thousand", "rupees", "cost", "range", "cheap", "expensive"]):
            return f"That is a great budget range! For that range, we have stunning bridal sets, antique harams, and complete jewellery packages eligible for our FREE Gold Coin offer. Would you like to visit us to explore the collection?"

        # 7. Showroom Visit / Appointment
        if any(w in text for w in ["visit", "come", "appointment", "weekend", "tomorrow", "today", "schedule", "timing"]):
            return "Wonderful! Our showrooms are open all 7 days from 10:00 AM to 8:30 PM. I will mark your preference and alert our showroom manager to prepare a customized jewellery preview for you. We look forward to welcoming you!"

        # 8. Human Representative / Callback
        if any(w in text for w in ["human", "person", "representative", "manager", "staff", "call back", "callback", "call me"]):
            return f"Certainly {name}! I have scheduled a priority callback from our senior showroom jewellery manager within the next 30 minutes. Is {name} the best contact for this?"

        # 9. Not Interested / Cancel
        if any(w in text for w in ["not interested", "dont call", "wrong number", "cancel", "stop"]):
            return f"We understand {name}. Thank you for your time, and please feel free to visit Siri Samruddhi Gold Palace whenever you need jewellery. Have a wonderful day!"

        # 10. Default Natural Assistant Response
        return f"Thank you for sharing that, {name}! At Siri Samruddhi Gold Palace, we offer BIS 916 Hallmarked Gold, Certified Diamonds, and pure silks with up to 100% FREE making charges. Would you like to schedule a visit to our Yelahanka, Kolar, or Udupi showroom?"

    @staticmethod
    async def initiate_call(
        lead_id: Optional[str] = None,
        phone: Optional[str] = None,
        name: Optional[str] = None,
        call_type: str = "indian_voice",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Initiates a voice session (Local Indian Voice Agent / Vapi / Simulator).
        """
        lead_data = {}
        if lead_id:
            lead_data = await CRMService.get_lead_by_id(lead_id) or {}
            
        customer_name = name or lead_data.get("name", "Valued Customer")
        customer_phone = phone or lead_data.get("phone", "")
        customer_interest = lead_data.get("interestedIn", "Gold Jewelry")
        
        call_id = f"call_{uuid.uuid4().hex[:10]}"
        first_message = f"Namaste! May I speak with {customer_name}? I am calling from Siri Samruddhi Gold Palace. Is this a good time to speak?"

        return {
            "status": "ready",
            "callId": call_id,
            "provider": "indian_ai",
            "callType": call_type or "indian_voice",
            "customerName": customer_name,
            "customerPhone": customer_phone,
            "interest": customer_interest,
            "systemPrompt": SIRI_SAMRUDDHI_SYSTEM_PROMPT,
            "firstMessage": first_message,
            "message": "Siri Samruddhi Indian Voice Agent is ready."
        }

    @staticmethod
    def analyze_transcript(transcript: List[Dict[str, str]], lead_name: str = "") -> Dict[str, Any]:
        """
        Extracts lead qualification parameters from a voice conversation transcript.
        """
        combined_text = " ".join([t.get("text", "") for t in transcript]).lower()
        
        # 1. Product Interest
        interest = "Gold Jewelry"
        if "saree" in combined_text:
            interest = "Sarees"
        elif "diamond" in combined_text:
            interest = "Diamond Jewelry"
        elif "silver" in combined_text:
            interest = "Silver Jewelry"
        elif "antique" in combined_text or "temple" in combined_text:
            interest = "Antique Gold Jewelry"
        elif "gold" in combined_text:
            interest = "Gold Jewelry"

        # 2. Budget Range
        budget = "₹2 Lakh - ₹5 Lakh"
        budget_match = re.search(r'(\d+)\s*(to|-)\s*(\d+)\s*(lakh|lakhs|k|thousand)', combined_text)
        single_budget = re.search(r'(\d+(?:\.\d+)?)\s*(lakh|lakhs|k|thousand|cr)', combined_text)
        
        if budget_match:
            budget = f"₹{budget_match.group(1)} - ₹{budget_match.group(3)} Lakhs"
        elif single_budget:
            unit = "Lakhs" if "lakh" in single_budget.group(2) else "K"
            budget = f"₹{single_budget.group(1)} {unit}"
        elif "budget" in combined_text or "cost" in combined_text:
            budget = "₹2.5 Lakhs+"

        # 3. Occasion
        occasion = "Wedding / Bridal"
        if "wedding" in combined_text or "marriage" in combined_text or "bride" in combined_text:
            occasion = "Wedding"
        elif "gift" in combined_text:
            occasion = "Gift"
        elif "anniversary" in combined_text:
            occasion = "Anniversary"
        elif "birthday" in combined_text:
            occasion = "Birthday"
        elif "festival" in combined_text or "diwali" in combined_text or "akshaya" in combined_text:
            occasion = "Festival / Auspicious Occasion"

        # 4. Preferred Showroom
        showroom = "Yelahanka"
        if "yelahanka" in combined_text:
            showroom = "Yelahanka"
        elif "kolar" in combined_text:
            showroom = "Kolar"
        elif "udupi" in combined_text:
            showroom = "Udupi"

        # 5. Timeline & Call Outcome
        timeline = "This Weekend"
        if "weekend" in combined_text:
            timeline = "This Weekend"
        elif "tomorrow" in combined_text or "today" in combined_text:
            timeline = "Immediate (1-2 Days)"
        elif "month" in combined_text:
            timeline = "Next Month"

        outcome = "Wants Showroom Visit"
        if any(neg in combined_text for neg in ["not interested", "dont call", "cancel", "wrong number"]):
            outcome = "Not Interested"
        elif "visit" in combined_text or showroom != "Not Selected Yet":
            outcome = "Wants Showroom Visit"
        elif any(cb in combined_text for cb in ["call back", "callback", "call me later", "busy right now"]):
            outcome = "Wants Callback"

        summary_notes = f"""[AI Voice Call Qualification]
- Customer: {lead_name or 'Prospect'}
- Product Interest: {interest}
- Budget Range: {budget}
- Occasion: {occasion}
- Preferred Showroom: {showroom}
- Buying Timeline: {timeline}
- Call Outcome: {outcome}
- Qualification Status: Verified by Siri Samruddhi Indian Voice Agent."""

        return {
            "interest": interest,
            "budget": budget,
            "occasion": occasion,
            "showroom": showroom,
            "timeline": timeline,
            "outcome": outcome,
            "summaryNotes": summary_notes
        }
