"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FITNESS BUDDY - AI-Powered Health Coach                  ║
║                    Built with IBM Watsonx.ai & Granite Models               ║
╚══════════════════════════════════════════════════════════════════════════════╝

AGENT_INSTRUCTIONS
==================
Customize the AI agent's behavior, tone, and specializations below.
All settings in this section are easy to modify without touching core logic.

TONE OPTIONS       : "friendly", "professional", "motivational", "strict"
LANGUAGE           : "English", "Hinglish" (Hindi+English mix)
CULTURE            : "Indian", "Western", "Global"
DIET_SPECIALIZATION: "vegetarian", "vegan", "non-vegetarian", "jain", "keto"
SAFETY_LEVEL       : "strict" (always add disclaimers), "moderate", "relaxed"
"""

# ─────────────────────────────────────────────────────────────────────────────
#  AGENT INSTRUCTIONS — Edit freely to customize behavior
# ─────────────────────────────────────────────────────────────────────────────
AGENT_INSTRUCTIONS = {
    # Personality & Tone
    "tone": "friendly",                   # friendly | professional | motivational | strict
    "language": "Hinglish",              # English | Hinglish
    "emoji_style": True,                  # True = use relevant emojis in responses

    # Cultural & Dietary Preferences
    "culture": "Indian",                  # Indian | Western | Global
    "diet_specialization": "vegetarian",  # vegetarian | vegan | non-vegetarian | jain | keto
    "indian_meal_preference": True,       # Prefer Indian meal suggestions (dal, sabzi, roti, etc.)
    "festival_awareness": True,           # Aware of Indian festivals & fasting patterns

    # Fitness Focus
    "workout_type": "home",               # home | gym | outdoor | mixed
    "intensity_default": "moderate",      # light | moderate | intense
    "yoga_preference": True,              # Include yoga & pranayama suggestions

    # Safety Rules
    "safety_level": "strict",             # strict | moderate | relaxed
    "always_recommend_doctor": True,      # Always suggest consulting doctor for medical conditions
    "age_sensitive": True,                # Adjust advice based on age groups

    # Response Format
    "response_language": "English",       # Final response language
    "max_response_length": "medium",      # short | medium | detailed
    "motivational_quotes": True,          # Include Hindi/English motivational quotes

    # Calorie & Nutrition
    "calorie_system": "metric",           # metric | imperial
    "nutrition_focus": "balanced",        # balanced | low-carb | high-protein | ayurvedic

    # System Prompt — Full agent persona (edit to reshape the agent completely)
    "system_prompt": """You are Fitness Buddy 💪, a warm, knowledgeable, and culturally aware AI fitness coach 
specialized for Indian users and families. You blend modern sports science with traditional Indian wellness wisdom 
including Ayurveda, Yoga, and seasonal eating.

Your core responsibilities:
1. 🏋️ Recommend personalized home workouts and exercise routines based on age, fitness level, and goals
2. 🥗 Suggest nutritious Indian meals — dal, sabzi, roti, millets, fruits, salads — aligned with user goals
3. 📊 Provide calorie analysis and macro breakdowns for Indian foods
4. 👨‍👩‍👧‍👦 Create family fitness plans considering different age groups (kids, adults, seniors)
5. 💬 Offer daily motivation, habit-building tips, and mental wellness advice
6. 🧘 Include Yoga, Pranayama, and Ayurvedic lifestyle tips
7. 🎯 Track and help users stay consistent with their fitness goals

Tone & Style:
- Warm, encouraging, never judgmental
- Use simple language; occasional Hinglish is fine and feels natural
- Add relevant emojis to make responses engaging
- Keep responses concise but complete — use bullet points and sections
- Celebrate small wins enthusiastically

Safety Rules (STRICT):
- ALWAYS recommend consulting a doctor for any medical conditions, injuries, or chronic diseases
- Never recommend extreme diets or unsafe fasting for weight loss
- For users under 16 or over 60, always suggest age-appropriate gentle exercises
- Never diagnose medical conditions — always refer to qualified professionals
- Add safety disclaimers when discussing supplements or intense workouts

Indian Cultural Awareness:
- Respect vegetarian, Jain, and vegan preferences
- Be aware of Indian festivals (Navratri fasting, Ramadan, Diwali sweets season)
- Suggest locally available, affordable Indian foods (not expensive imported items)
- Reference traditional Indian exercises: Surya Namaskar, Mallakhamb, Kushti, walking in parks
- Understand joint family dynamics for family fitness planning

Always end responses with a short motivational line in English or Hindi. 🌟"""
}
# ─────────────────────────────────────────────────────────────────────────────
#  END OF AGENT INSTRUCTIONS
# ─────────────────────────────────────────────────────────────────────────────

import os
import json
import re
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

# ── Load environment variables ────────────────────────────────────────────────
# Use explicit path so .env is found regardless of working directory
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fitness-buddy-secret-2024")
CORS(app)

# ── IBM Watsonx.ai Configuration ──────────────────────────────────────────────
IBM_API_KEY    = os.getenv("IBM_API_KEY")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
IBM_REGION     = os.getenv("IBM_REGION", "au-syd")   # Sydney region
WATSONX_URL    = f"https://{IBM_REGION}.ml.cloud.ibm.com"

# Model — use llama-3-3-70b-instruct (available in your Sydney project)
GRANITE_MODEL  = os.getenv("GRANITE_MODEL", "meta-llama/llama-3-3-70b-instruct")

# ── Calorie Reference Data (Indian Foods) ────────────────────────────────────
CALORIE_DB = {
    # Grains & Breads
    "roti": {"calories": 71, "protein": 3, "carbs": 15, "fat": 0.4, "serving": "1 medium roti (40g)"},
    "rice": {"calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "serving": "1 cup cooked (180g)"},
    "paratha": {"calories": 200, "protein": 4, "carbs": 30, "fat": 7, "serving": "1 medium paratha"},
    "idli": {"calories": 58, "protein": 2, "carbs": 12, "fat": 0.1, "serving": "1 idli (60g)"},
    "dosa": {"calories": 133, "protein": 3, "carbs": 25, "fat": 2, "serving": "1 plain dosa"},
    "poha": {"calories": 180, "protein": 3, "carbs": 35, "fat": 3, "serving": "1 bowl (100g)"},
    "upma": {"calories": 170, "protein": 4, "carbs": 28, "fat": 5, "serving": "1 bowl (100g)"},
    "bread": {"calories": 79, "protein": 3, "carbs": 15, "fat": 1, "serving": "1 slice (30g)"},

    # Lentils & Legumes
    "dal": {"calories": 116, "protein": 9, "carbs": 20, "fat": 0.5, "serving": "1 bowl (150g)"},
    "chana": {"calories": 164, "protein": 9, "carbs": 27, "fat": 3, "serving": "1 cup cooked"},
    "rajma": {"calories": 127, "protein": 9, "carbs": 22, "fat": 0.5, "serving": "1 cup cooked"},
    "moong dal": {"calories": 105, "protein": 7, "carbs": 19, "fat": 0.4, "serving": "1 bowl"},
    "paneer": {"calories": 265, "protein": 18, "carbs": 3, "fat": 20, "serving": "100g"},
    "curd": {"calories": 61, "protein": 3, "carbs": 5, "fat": 3, "serving": "1 cup (120g)"},

    # Vegetables
    "spinach": {"calories": 23, "protein": 3, "carbs": 4, "fat": 0.4, "serving": "1 cup (180g)"},
    "potato": {"calories": 87, "protein": 2, "carbs": 20, "fat": 0.1, "serving": "1 medium (150g)"},
    "tomato": {"calories": 22, "protein": 1, "carbs": 5, "fat": 0.2, "serving": "1 medium (120g)"},
    "onion": {"calories": 40, "protein": 1, "carbs": 9, "fat": 0.1, "serving": "1 medium (100g)"},
    "broccoli": {"calories": 34, "protein": 3, "carbs": 7, "fat": 0.4, "serving": "1 cup (90g)"},
    "carrot": {"calories": 41, "protein": 1, "carbs": 10, "fat": 0.2, "serving": "1 medium (80g)"},

    # Fruits
    "banana": {"calories": 89, "protein": 1, "carbs": 23, "fat": 0.3, "serving": "1 medium (118g)"},
    "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2, "serving": "1 medium (182g)"},
    "mango": {"calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4, "serving": "1 cup diced (165g)"},
    "orange": {"calories": 47, "protein": 1, "carbs": 12, "fat": 0.1, "serving": "1 medium (130g)"},
    "papaya": {"calories": 43, "protein": 0.5, "carbs": 11, "fat": 0.3, "serving": "1 cup (140g)"},
    "guava": {"calories": 68, "protein": 2.5, "carbs": 14, "fat": 1, "serving": "1 medium (90g)"},

    # Dairy & Proteins
    "milk": {"calories": 61, "protein": 3, "carbs": 5, "fat": 3, "serving": "1 glass (240ml)"},
    "egg": {"calories": 78, "protein": 6, "carbs": 0.6, "fat": 5, "serving": "1 large egg"},
    "chicken": {"calories": 165, "protein": 31, "carbs": 0, "fat": 4, "serving": "100g cooked"},
    "fish": {"calories": 136, "protein": 28, "carbs": 0, "fat": 2, "serving": "100g cooked"},

    # Snacks & Others
    "samosa": {"calories": 262, "protein": 5, "carbs": 25, "fat": 17, "serving": "1 samosa"},
    "chai": {"calories": 80, "protein": 2, "carbs": 12, "fat": 2, "serving": "1 cup with milk & sugar"},
    "coffee": {"calories": 20, "protein": 1, "carbs": 3, "fat": 0.5, "serving": "1 cup black"},
    "nuts": {"calories": 172, "protein": 5, "carbs": 6, "fat": 15, "serving": "30g mixed nuts"},
    "ghee": {"calories": 135, "protein": 0, "carbs": 0, "fat": 15, "serving": "1 tbsp (15g)"},
    "oil": {"calories": 120, "protein": 0, "carbs": 0, "fat": 14, "serving": "1 tbsp"},
}

# ── Exercise MET Values (Metabolic Equivalent of Task) ───────────────────────
EXERCISE_MET = {
    "walking": 3.5, "brisk walking": 5.0, "running": 8.0, "jogging": 7.0,
    "cycling": 7.5, "swimming": 8.0, "yoga": 3.0, "surya namaskar": 5.0,
    "strength training": 5.0, "hiit": 8.0, "dancing": 5.5, "badminton": 5.5,
    "cricket": 4.0, "football": 7.0, "skipping": 10.0, "stair climbing": 6.0,
}

# ── Watsonx Client Initialization ────────────────────────────────────────────
watsonx_client = None
model = None

def initialize_watsonx():
    """Initialize IBM Watsonx.ai client with Granite model (ibm-watsonx-ai 1.5.x)."""
    global watsonx_client, model
    try:
        credentials = Credentials(
            url=WATSONX_URL,
            api_key=IBM_API_KEY
        )
        # In 1.5.x APIClient is optional; credentials flow directly into ModelInference
        watsonx_client = APIClient(credentials=credentials, project_id=IBM_PROJECT_ID)
        model = ModelInference(
            model_id=GRANITE_MODEL,
            api_client=watsonx_client,
            project_id=IBM_PROJECT_ID,
            validate=False   # skip model availability check on init
        )
        print(f"Watsonx.ai connected -- Model: {GRANITE_MODEL} | Region: {IBM_REGION}")
        return True
    except Exception as e:
        print(f"Watsonx.ai initialization failed: {e}")
        return False

# ── Helper: Build Messages (Chat API format) ─────────────────────────────────
def build_messages(user_message: str, profile: dict, chat_history: list) -> list:
    """Build messages list for the chat API with system context and history."""
    system = AGENT_INSTRUCTIONS["system_prompt"]

    # Personalize system prompt with profile if available
    if profile and profile.get("name"):
        system += f"""

Current User Profile:
- Name: {profile.get('name', 'User')}
- Age: {profile.get('age', 'Not specified')}
- Gender: {profile.get('gender', 'Not specified')}
- Weight: {profile.get('weight', 'Not specified')} kg
- Height: {profile.get('height', 'Not specified')} cm
- Fitness Goal: {profile.get('goal', 'General fitness')}
- Diet Preference: {profile.get('diet', AGENT_INSTRUCTIONS['diet_specialization'])}
- Activity Level: {profile.get('activity', 'moderate')}
- Health Conditions: {profile.get('health_conditions', 'None mentioned')}"""

    messages = [{"role": "system", "content": system}]

    # Add last 6 exchanges from history
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add current user message
    messages.append({"role": "user", "content": user_message})
    return messages

# ── Helper: Call Watsonx ──────────────────────────────────────────────────────
def call_watsonx(user_message: str, profile: dict = None, chat_history: list = None) -> str:
    """Send messages to LLM via chat API and return response text."""
    if not model:
        return get_fallback_response()
    try:
        messages = build_messages(
            user_message,
            profile or {},
            chat_history or []
        )
        response = model.chat(
            messages=messages,
            params={
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.9,
            }
        )
        # Extract content from chat response
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Watsonx API error: {e}")
        return get_fallback_response()

def get_fallback_response() -> str:
    return ("🌟 I'm having trouble connecting to the AI service right now. "
            "Please check your IBM Watsonx.ai credentials in the .env file and try again. "
            "Make sure your API key and Project ID are correct. 💪")

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Main application page."""
    if "chat_history" not in session:
        session["chat_history"] = []
    if "profile" not in session:
        session["profile"] = {}
    if "family_members" not in session:
        session["family_members"] = []
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages with Watsonx.ai."""
    data = request.get_json()
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    profile = session.get("profile", {})
    chat_history = session.get("chat_history", [])

    # Add user message to history
    chat_history.append({"role": "user", "content": user_message})

    # Call Watsonx with full context (history excludes the just-added user msg)
    ai_response = call_watsonx(user_message, profile, chat_history[:-1])

    # Add AI response to history
    chat_history.append({"role": "assistant", "content": ai_response})

    # Keep last 20 messages to avoid session bloat
    session["chat_history"] = chat_history[-20:]
    session.modified = True

    return jsonify({
        "response": ai_response,
        "timestamp": datetime.now().strftime("%I:%M %p")
    })

@app.route("/api/profile", methods=["GET", "POST"])
def profile():
    """Get or update user profile."""
    if request.method == "POST":
        data = request.get_json()
        session["profile"] = data
        session.modified = True
        return jsonify({"status": "success", "message": "Profile saved! 🎉"})
    return jsonify(session.get("profile", {}))

@app.route("/api/family", methods=["GET", "POST"])
def family():
    """Get or update family members."""
    if request.method == "POST":
        data = request.get_json()
        session["family_members"] = data.get("members", [])
        session.modified = True
        return jsonify({"status": "success", "message": "Family profiles saved! 👨‍👩‍👧‍👦"})
    return jsonify({"members": session.get("family_members", [])})

@app.route("/api/family/plan", methods=["POST"])
def family_plan():
    """Generate AI fitness plan for a family member."""
    data = request.get_json()
    member = data.get("member", {})
    profile = session.get("profile", {})

    prompt_text = f"""Create a personalized 7-day fitness and meal plan for:
Name: {member.get('name', 'Family Member')}
Age: {member.get('age', 'Unknown')} years
Gender: {member.get('gender', 'Not specified')}
Health Conditions: {member.get('health_conditions', 'None')}
Fitness Goal: {member.get('goal', 'General wellness')}
Diet: {member.get('diet', 'Vegetarian')}

Please provide:
1. 🏃 Weekly exercise routine (suitable for their age and health)
2. 🥗 Daily meal suggestions (Indian food preferred)
3. 💧 Hydration and wellness tips
4. ⚠️ Any special precautions for their age/health

Keep it practical, affordable, and achievable for an Indian household."""

    ai_response = call_watsonx(prompt_text, profile, [])
    return jsonify({"plan": ai_response, "member": member.get("name", "Family Member")})

@app.route("/api/calories/calculate", methods=["POST"])
def calculate_calories():
    """Calculate calories for food items from local database."""
    data = request.get_json()
    food_items = data.get("items", [])
    results = []
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}

    for item in food_items:
        name = item.get("name", "").lower().strip()
        qty  = float(item.get("quantity", 1))

        # Try exact match first, then partial match
        matched = None
        if name in CALORIE_DB:
            matched = name
        else:
            for key in CALORIE_DB:
                if key in name or name in key:
                    matched = key
                    break

        if matched:
            food = CALORIE_DB[matched]
            result = {
                "name": item.get("name"),
                "quantity": qty,
                "serving": food["serving"],
                "calories": round(food["calories"] * qty, 1),
                "protein":  round(food["protein"] * qty, 1),
                "carbs":    round(food["carbs"] * qty, 1),
                "fat":      round(food["fat"] * qty, 1),
                "found": True
            }
            totals["calories"] += result["calories"]
            totals["protein"]  += result["protein"]
            totals["carbs"]    += result["carbs"]
            totals["fat"]      += result["fat"]
        else:
            result = {"name": item.get("name"), "quantity": qty, "found": False}
        results.append(result)

    totals = {k: round(v, 1) for k, v in totals.items()}
    return jsonify({"items": results, "totals": totals})

@app.route("/api/calories/analyze", methods=["POST"])
def analyze_calories():
    """Get AI analysis of calorie intake."""
    data = request.get_json()
    totals  = data.get("totals", {})
    profile = session.get("profile", {})
    goal    = profile.get("goal", "general fitness")
    weight  = profile.get("weight", 65)
    age     = profile.get("age", 30)
    gender  = profile.get("gender", "not specified")

    prompt_text = f"""Analyze this daily nutrition for a {age}-year-old {gender} weighing {weight}kg with goal: {goal}
Total Calories: {totals.get('calories', 0)} kcal
Protein: {totals.get('protein', 0)}g
Carbohydrates: {totals.get('carbs', 0)}g
Fat: {totals.get('fat', 0)}g

Please provide:
1. 📊 Is this intake appropriate for their goal?
2. ✅ What's good about this diet
3. ⚠️ What needs improvement
4. 🥗 Specific Indian food suggestions to balance the diet
5. 💡 One simple change to make tomorrow"""

    analysis = call_watsonx(prompt_text, profile, [])
    return jsonify({"analysis": analysis})

@app.route("/api/exercise/calories", methods=["POST"])
def exercise_calories():
    """Calculate calories burned during exercise."""
    data     = request.get_json()
    exercise = data.get("exercise", "walking").lower()
    duration = float(data.get("duration", 30))  # minutes
    weight   = float(data.get("weight", session.get("profile", {}).get("weight", 65)))

    # Find closest MET value
    met = 4.0  # default
    for key in EXERCISE_MET:
        if key in exercise or exercise in key:
            met = EXERCISE_MET[key]
            break

    # Calories = MET × weight(kg) × duration(hours)
    calories_burned = round(met * weight * (duration / 60), 1)
    return jsonify({
        "exercise": exercise,
        "duration_minutes": duration,
        "weight_kg": weight,
        "calories_burned": calories_burned,
        "met_value": met
    })

@app.route("/api/workout/generate", methods=["POST"])
def generate_workout():
    """Generate personalized workout plan using Watsonx.ai."""
    data    = request.get_json()
    profile = session.get("profile", {})

    # Merge request data with profile
    goal        = data.get("goal", profile.get("goal", "general fitness"))
    fitness_lvl = data.get("fitness_level", profile.get("activity", "beginner"))
    duration    = data.get("duration", 30)
    focus_area  = data.get("focus_area", "full body")
    equipment   = data.get("equipment", "none")
    age         = data.get("age", profile.get("age", 30))

    prompt_text = f"""Create a detailed {duration}-minute home workout plan:
- Goal: {goal}
- Fitness Level: {fitness_lvl}
- Age: {age} years
- Focus Area: {focus_area}
- Available Equipment: {equipment}

Format the plan with:
1. 🔥 Warm-up (5 mins) — specific exercises with reps
2. 💪 Main Workout — exercises with sets, reps, rest time
3. 🧘 Cool-down & Stretching (5 mins)
4. 📋 Weekly schedule suggestion
5. 💡 Tips for progression

Include Indian traditional exercises (Surya Namaskar, Yoga asanas) where appropriate.
Add safety reminders."""

    workout  = call_watsonx(prompt_text, profile, [])
    return jsonify({"workout": workout})

@app.route("/api/meal/suggest", methods=["POST"])
def suggest_meal():
    """Generate AI meal suggestions."""
    data    = request.get_json()
    profile = session.get("profile", {})
    meal_type   = data.get("meal_type", "full day")
    calories    = data.get("target_calories", 1800)
    preferences = data.get("preferences", profile.get("diet", "vegetarian"))
    goal        = data.get("goal", profile.get("goal", "balanced nutrition"))

    prompt_text = f"""Suggest a {meal_type} Indian meal plan:
- Target Calories: {calories} kcal
- Diet Preference: {preferences}
- Health Goal: {goal}
- Age Group: {profile.get('age', 'Adult')}

For each meal provide:
- 🍽️ Meal name and items
- 📊 Approximate calories
- ⏰ Best time to eat
- 👩‍🍳 Simple preparation tips
- 🔄 Healthy alternatives

Include breakfast, lunch, dinner, and 2 healthy snack options.
All suggestions must use readily available Indian ingredients."""

    suggestions = call_watsonx(prompt_text, profile, [])
    return jsonify({"suggestions": suggestions})

@app.route("/api/bmi", methods=["POST"])
def calculate_bmi():
    """Calculate BMI and provide health assessment."""
    data   = request.get_json()
    weight = float(data.get("weight", 0))
    height = float(data.get("height", 0))
    age    = int(data.get("age", 25))

    if not weight or not height:
        return jsonify({"error": "Weight and height are required"}), 400

    height_m = height / 100
    bmi      = round(weight / (height_m ** 2), 1)

    if bmi < 18.5:
        category, color, advice = "Underweight", "#3b82f6", "Focus on nutrient-dense foods and strength training"
    elif bmi < 25:
        category, color, advice = "Normal Weight ✅", "#22c55e", "Maintain current routine with balanced diet"
    elif bmi < 30:
        category, color, advice = "Overweight", "#f59e0b", "Focus on cardio and calorie-deficit diet"
    else:
        category, color, advice = "Obese", "#ef4444", "Consult a doctor; start with low-impact exercises"

    # Ideal weight range
    ideal_min = round(18.5 * (height_m ** 2), 1)
    ideal_max = round(24.9 * (height_m ** 2), 1)

    return jsonify({
        "bmi": bmi,
        "category": category,
        "color": color,
        "advice": advice,
        "ideal_weight_min": ideal_min,
        "ideal_weight_max": ideal_max,
        "height": height,
        "weight": weight
    })

@app.route("/api/clear-chat", methods=["POST"])
def clear_chat():
    """Clear chat history."""
    session["chat_history"] = []
    session.modified = True
    return jsonify({"status": "success"})

@app.route("/api/status", methods=["GET"])
def status():
    """API health check."""
    return jsonify({
        "status": "online",
        "watsonx_connected": model is not None,
        "model": GRANITE_MODEL,
        "region": IBM_REGION,
        "version": "1.0.0"
    })

# ── Application Entry Point ───────────────────────────────────────────────────
import os

port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port)
