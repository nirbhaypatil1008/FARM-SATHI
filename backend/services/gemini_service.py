"""
Gemini AI Farmer Assistant Service.
Integrates Google Gemini 1.5 API with strict agronomic guardrails.
Includes offline expert fallback mode when API key is unconfigured.
"""

import logging
from typing import Optional, List, Dict, Any
import httpx
from utils.config import settings

logger = logging.getLogger("krishi_saathi.ai")

# Strict agricultural system prompt
AGRICULTURE_SYSTEM_PROMPT = """
You are "Krishi Saathi AI", an expert agricultural advisor assisting Indian farmers.
Follow these mandatory guidelines:
1. Provide accurate, practical, and actionable farming advice.
2. Always respond in the farmer's preferred regional language (e.g. Hindi, Punjabi, Marathi, Telugu, Tamil, Bengali, or English).
3. Strict Safety & Chemical Guardrail: Never invent chemical dosages, pesticide concentrations, or unapproved mixtures.
4. Always prioritize Integrated Pest Management (IPM), cultural controls, and organic biological remedies first.
5. For chemical pesticides/fungicides, advise following CIBRC (Central Insecticides Board & Registration Committee) registered labels and recommend verifying with the local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer.
6. Provide structured responses: Symptoms/Cause, Organic/Immediate Action, Preventive Steps, Safety Disclaimer.
7. Tone: Respectful, encouraging, simple, and jargon-free.
"""

# Curated offline agronomic knowledge base for zero-configuration fallback
OFFLINE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "yellow rust": {
        "hi": (
            "**पीला रतुआ (Yellow Rust) की पहचान और उपचार:**\n\n"
            "• **लक्षण:** पत्तियों पर समानांतर पट्टियों में पीले रंग के चूर्ण जैसे दाने बनते हैं।\n"
            "• **जैविक/प्राकृतिक नियंत्रण:** ट्राइकोडर्मा विरिडी या स्यूडोमोनास फ्लोरेसेंस का छिड़काव करें।\n"
            "• **रासायनिक प्रबंधन:** संक्रमण गंभीर होने पर प्रोपिकोनाज़ोल 25% EC (टिल्ट) 1 मिली प्रति लीटर पानी में मिलाकर तुरंत छिड़काव करें।\n"
            "• **सावधानी:** सुबह या शाम के समय छिड़काव करें। स्थानीय कृषि विज्ञान केंद्र (KVK) से मार्गदर्शन लें।"
        ),
        "en": (
            "**Wheat Yellow Rust (Stripe Rust) Advisory:**\n\n"
            "• **Symptoms:** Yellow pustules formed in linear stripes on leaf blades.\n"
            "• **Biological Control:** Apply Trichoderma viride or Pseudomonas fluorescens.\n"
            "• **Chemical Management:** If infection spreads, spray Propiconazole 25% EC @ 1 ml/litre of water.\n"
            "• **Precaution:** Spray during early morning or calm evening. Consult local KVK."
        ),
        "actions": ["Inspect field daily for yellow leaf stripes", "Avoid excessive nitrogen fertilizers", "Spray Propiconazole if spread > 5%"]
    },
    "fertilizer": {
        "hi": (
            "**संतुलित उर्वरक प्रबंधन (NPK):**\n\n"
            "• मिट्टी की जांच (Soil Health Card) के अनुसार ही खाद डालें।\n"
            "• सामान्य अनुपात 4:2:1 (नाइट्रोजन : फास्फोरस : पोटाश) अनुशंसित है।\n"
            "• यूरिया को 2-3 बार में बांटकर (Split Application) डालें ताकि बर्बादी न हो।\n"
            "• गोबर की सड़ी खाद (FYM) या कम्पोस्ट 5-8 टन प्रति हेक्टेयर अवश्य मिलाएं।"
        ),
        "en": (
            "**Balanced Fertilizer Management:**\n\n"
            "• Apply fertilizers strictly based on your Soil Health Card recommendation.\n"
            "• Standard recommended ratio for major cereals is 4:2:1 (N:P:K).\n"
            "• Split Nitrogen (Urea) into 2-3 doses (at sowing, first irrigation, and tillering stage).\n"
            "• Incorporate 5-8 tonnes of decomposed Farm Yard Manure (FYM) per hectare."
        ),
        "actions": ["Get Soil Health Card updated", "Split Urea dosage", "Use Neem-coated Urea"]
    },
    "default": {
        "hi": (
            "**कृषि साथी सलाहकार सुझाव:**\n\n"
            "आपके प्रश्न के संदर्भ में उत्तम कृषि पद्धतियों का पालन करें:\n"
            "1. समय पर निराई-गुड़ाई और सिंचाई करें।\n"
            "2. कीट एवं रोगों की रोकथाम हेतु जैविक नीम के तेल (10,000 PPM) 2-3 मिली/लीटर का प्रयोग करें।\n"
            "3. रासायनिक दवाओं का प्रयोग केवल अनिवार्य होने पर अधिकृत लेबल निर्देशों के अनुसार ही करें।\n"
            "4. किसी भी विशेष समस्या के लिए नजदीकी कृषि विज्ञान केंद्र (KVK) या किसान कॉल सेंटर (1800-180-1551) पर संपर्क करें।"
        ),
        "en": (
            "**Krishi Saathi Farming Advisory:**\n\n"
            "For optimal crop health and yield:\n"
            "1. Maintain proper plant spacing, weed control, and soil aeration.\n"
            "2. Utilize botanical pesticides like Neem Oil (10,000 PPM @ 2-3 ml/L) as a first line of defense.\n"
            "3. Ensure timely irrigation based on current soil moisture and weather forecast.\n"
            "4. For specific crop queries, contact your nearest Krishi Vigyan Kendra (KVK) or Kisan Call Centre (1800-180-1551)."
        ),
        "actions": ["Maintain soil moisture", "Apply Neem oil preventive spray", "Consult nearest KVK"]
    }
}


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    async def ask_assistant(
        self,
        question: str,
        language: str = "hi",
        crop_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Queries Google Gemini 1.5 Flash API with agricultural system instructions.
        Falls back seamlessly to offline expert knowledge base if API key is missing.
        """
        # If API key is present, attempt live call
        if self.api_key:
            try:
                full_prompt = (
                    f"{AGRICULTURE_SYSTEM_PROMPT}\n\n"
                    f"Farmer Preferred Language: {language}\n"
                    f"Crop Context: {crop_context or 'General Agriculture'}\n"
                    f"Farmer Question: {question}\n\n"
                    f"Provide response in {language} language."
                )

                payload = {
                    "contents": [{
                        "parts": [{"text": full_prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,  # Low temperature for factual precision
                        "maxOutputTokens": 1024,
                    }
                }

                url = f"{self.base_url}?key={self.api_key}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text_part:
                            return {
                                "answer": text_part,
                                "language": language,
                                "source": "Google Gemini 1.5 Flash (Verified Agro Prompt)",
                                "suggested_actions": [
                                    "Inspect field regularly",
                                    "Consult local Krishi Vigyan Kendra for confirmation",
                                    "Check Soil Health Card recommendations"
                                ]
                            }
                else:
                    logger.error(f"Gemini API returned status {response.status_code}: {response.text}")

            except Exception as e:
                logger.exception(f"Error querying Gemini API: {e}")

        # Safe Offline Advisory Fallback
        q_lower = question.lower()
        if "yellow rust" in q_lower or "रतुआ" in q_lower or "rust" in q_lower:
            kb_entry = OFFLINE_KNOWLEDGE_BASE["yellow rust"]
        elif "fertilizer" in q_lower or "खाद" in q_lower or "यूरिया" in q_lower or "npk" in q_lower:
            kb_entry = OFFLINE_KNOWLEDGE_BASE["fertilizer"]
        else:
            kb_entry = OFFLINE_KNOWLEDGE_BASE["default"]

        lang_key = "hi" if language == "hi" else "en"
        answer = kb_entry.get(lang_key, kb_entry["en"])
        watermark = (
            "\n\n*[Note: Safe Offline Advisory Mode - Configure GEMINI_API_KEY in .env for live AI queries]*"
            if not self.api_key else ""
        )

        return {
            "answer": answer + watermark,
            "language": language,
            "source": "Krishi Saathi Verified Expert Knowledge Base (Offline Fallback)",
            "suggested_actions": kb_entry.get("actions", ["Consult nearest KVK", "Inspect crop leaves", "Check soil moisture"])
        }


gemini_service = GeminiService()
