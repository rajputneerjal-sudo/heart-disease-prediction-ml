from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
import os
import httpx
import re

from database.database import get_db
from models.models import User, ChatbotHistory
from schemas.schemas import ChatbotMessageRequest, ChatbotMessageResponse, ChatbotHistoryResponse
from api.dependencies import get_current_user

router = APIRouter(prefix="/chatbot", tags=["Healthcare Chatbot"])

DISCLAIMER = (
    "This chatbot provides general health awareness information and is not a substitute for professional medical advice, diagnosis, or treatment."
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def extract_latest_user_message(message: str) -> str:
    text = (message or "").strip()
    if not text:
        return ""

    # Strict multiline match first: User: <message>
    matches = re.findall(r"(?im)^\s*user\s*:\s*(.+)$", text)
    if matches:
        return matches[-1].strip()

    # Fallback: take content after last "user:" token if present.
    lower = text.lower()
    idx = lower.rfind("user:")
    if idx != -1:
        return text[idx + len("user:"):].strip()

    # If no explicit markers, treat provided text as the current prompt.
    return text


def build_chatbot_response(message: str) -> str:
    # Important: use only the latest user prompt for fallback matching.
    text = extract_latest_user_message(message).lower()
    words = set(re.findall(r"[a-zA-Z0-9]+", text))

    # Priority handling for common direct questions to avoid generic/repeated replies.
    # Check cholesterol questions FIRST before general intents (including common misspellings)
    cholesterol_variants = {"cholesterol", "cholestorol", "cholestrol", "colesterol"}
    if (words & cholesterol_variants) and ({"good", "normal", "level", "range", "boy", "girl", "man", "woman", "year", "old", "age"} & words):
        # Extract age if mentioned
        age_match = re.search(r'\b(\d{1,3})\s*(?:year|yr|y\.o\.|yo)', text)
        age_context = ""
        if age_match:
            age = int(age_match.group(1))
            if age < 20:
                age_context = " For young adults under 20, cholesterol screening helps establish a baseline."
            elif 20 <= age < 40:
                age_context = " For adults in their 20s-30s, maintaining healthy levels early prevents future risk."
        
        return (
            "Typical lipid targets for adults are: total cholesterol < 200 mg/dL, LDL < 100 mg/dL (or lower if high-risk), "
            "HDL > 40 mg/dL in men and > 50 mg/dL in women, triglycerides < 150 mg/dL."
            f"{age_context} "
            "A full lipid profile with your clinician is the best way to personalize your target based on your age, weight, and overall health."
        )

    # Define intents for general matching
    intents = [
        (
            {"symptom", "symptoms", "chest", "pain", "breathless", "dizzy", "faint", "jaw", "arm"},
            "Common heart warning signs include chest discomfort, shortness of breath, unusual fatigue, dizziness, and pain that may radiate to jaw/arm/back. If symptoms are severe, sudden, or persistent, seek emergency care immediately.",
        ),
        (
            {"cholesterol", "cholestorol", "cholestrol", "colesterol", "ldl", "hdl", "lipid", "triglyceride", "triglycerides"},
            "To improve cholesterol, increase soluble fiber (oats, legumes, fruits), reduce trans and saturated fat, exercise regularly, maintain healthy weight, and follow periodic lipid checks with your clinician.",
        ),
        (
            {"blood", "pressure", "bp", "hypertension", "sodium", "salt"},
            "For blood pressure control: reduce sodium, stay physically active, limit alcohol, manage stress, sleep 7-9 hours, and take prescribed medicines consistently.",
        ),
        (
            {"exercise", "workout", "walk", "walking", "cardio", "activity", "active"},
            "A common target is at least 150 minutes/week of moderate aerobic activity plus 2 strength sessions weekly, adjusted for age, fitness, and medical conditions.",
        ),
        (
            {"diet", "food", "eat", "meal", "nutrition", "vegetable", "fruit"},
            "Heart-friendly eating includes vegetables, fruits, whole grains, legumes, nuts, fish, and minimal processed foods, added sugar, and excess salt.",
        ),
        (
            {"smoke", "smoking", "tobacco", "cigarette", "vape"},
            "Smoking and tobacco increase cardiovascular risk significantly. Quitting improves circulation and steadily lowers long-term heart attack and stroke risk.",
        ),
        (
            {"sleep", "insomnia", "snore", "apnea", "rest"},
            "Good sleep supports heart health. Aim for a regular 7-9 hour sleep schedule and evaluate persistent snoring, daytime fatigue, or poor sleep quality.",
        ),
        (
            {"stress", "anxiety", "tension", "mental", "depression"},
            "Stress can affect blood pressure and heart strain. Helpful habits include breathing exercises, regular movement, social support, and consistent sleep routines.",
        ),
        (
            {"heart", "what", "function", "works", "pump", "cardiac"},
            "The heart is a muscular pump that circulates oxygen-rich blood to the body and returns oxygen-poor blood to the lungs. Healthy habits protect this system over time.",
        ),
    ]

    emergency_terms = {"severe", "crushing", "unconscious", "cannot", "stroke", "sudden"}
    if ("chest" in words and "pain" in words) or (words & emergency_terms and {"breath", "breathless", "faint", "dizzy"} & words):
        return "Possible emergency symptoms detected. If there is chest pressure, severe breathlessness, fainting, one-sided weakness, or trouble speaking, call emergency services now."

    best_reply = None
    best_score = 0
    for keys, reply in intents:
        score = len(words & keys)
        if score > best_score:
            best_score = score
            best_reply = reply

    if best_reply:
        return best_reply

    return (
        "I can help with heart-health topics such as symptoms, prevention, diet, exercise, cholesterol, blood pressure, sleep, and stress. "
        "Please share a bit more detail (for example age group, symptoms, or goal), and I will give practical next-step guidance."
    )


async def generate_openai_response(message: str) -> str:
    if not OPENAI_API_KEY:
        return ""
    
    # Extract the latest user question
    latest_question = extract_latest_user_message(message)
    
    system_prompt = (
        "You are a heart-health awareness assistant. Give clear, practical, educational guidance. "
        "Do not diagnose and do not prescribe medications. If emergency symptoms are described, advise immediate emergency care. "
        "IMPORTANT: Answer the CURRENT question specifically and accurately. Do not repeat previous answers. "
        f"Include this disclaimer exactly once at the end: {DISCLAIMER}"
    )
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Conversation context:\n{message}\n\nCurrent question to answer: {latest_question}"},
        ],
        "temperature": 0.4,
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            if DISCLAIMER not in text:
                text = f"{text}\n\n{DISCLAIMER}"
            return text
    except Exception:
        return ""


async def generate_gemini_response(message: str) -> str:
    if GEMINI_API_KEY:
        # Extract the latest user question
        latest_question = extract_latest_user_message(message)
        
        prompt = (
            "You are a heart-health awareness assistant. Provide concise educational guidance only. "
            "Do not diagnose. If emergency symptoms are described, advise immediate emergency care. "
            f"Always include this disclaimer exactly once at the end: {DISCLAIMER}\n\n"
            f"IMPORTANT: Answer the CURRENT question specifically. Do not repeat previous answers.\n\n"
            f"Conversation context:\n{message}\n\n"
            f"Current question to answer: {latest_question}"
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if DISCLAIMER not in text:
                    text = f"{text}\n\n{DISCLAIMER}"
                return text
        except Exception:
            pass

    openai_text = await generate_openai_response(message)
    if openai_text:
        return openai_text

    fallback = build_chatbot_response(message)
    return f"{fallback}\n\n{DISCLAIMER}"


@router.post("/message", response_model=ChatbotMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: ChatbotMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(ChatbotHistory)
        .filter(ChatbotHistory.user_id == current_user.id)
        .order_by(desc(ChatbotHistory.timestamp))
        .limit(6)
        .all()
    )
    history.reverse()
    context_lines = []
    for item in history:
        context_lines.append(f"User: {item.message}")
        context_lines.append(f"Assistant: {item.response}")
    context_lines.append(f"User: {payload.message}")
    full_context = "\n".join(context_lines)
    
    # Try to get AI response first
    response = await generate_gemini_response(full_context)
    
    # Check if the response is just the generic fallback or a repeat
    latest_user_msg = payload.message.strip().lower()
    is_generic_fallback = "I can help with heart-health topics" in response
    is_repeat = False
    
    if history:
        # Check if response is identical to the last response but question is different
        if history[-1].message.strip().lower() != latest_user_msg and history[-1].response.strip() == response.strip():
            is_repeat = True
    
    # If we got a generic fallback or repeat, try the rule-based system with the current message only
    if is_generic_fallback or is_repeat:
        refined = build_chatbot_response(payload.message)
        # Only use refined response if it's not the generic fallback
        if "I can help with heart-health topics" not in refined:
            response = f"{refined}\n\n{DISCLAIMER}"
    
    log = ChatbotHistory(user_id=current_user.id, message=payload.message, response=response)
    db.add(log)
    db.commit()
    return {"response": response, "disclaimer": DISCLAIMER}


@router.get("/history", response_model=list[ChatbotHistoryResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(ChatbotHistory)
        .filter(ChatbotHistory.user_id == current_user.id)
        .order_by(desc(ChatbotHistory.timestamp))
        .limit(100)
        .all()
    )
