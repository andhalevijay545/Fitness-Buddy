IMPORTANAT LINKS
PPT LINK:https://1drv.ms/p/c/BB63A2F89C1DE2AB/IQDGAyGAxnuETahWszEaqenEAS2Hk8BXNTLKhj65vY2z8cU?e=gxj6ZB
DEPLOYMENT LINK:https://fitness-buddy-anqp.onrender.com/
LINKDIN PROFILE:www.linkedin.com/in/vijayandhale545
# ══════════════════════════════════════════════════════════════════════════════
# 🏋️  FITNESS BUDDY — Complete Deployment Guide
# AI-Powered Health Coach | IBM Watsonx.ai + Granite + Flask
# ══════════════════════════════════════════════════════════════════════════════

## 📋 Project Overview
🎉 Open your browser and go to: **http://localhost:5000**

**Fitness Buddy** is a full-stack AI-powered web application that acts as a
personal health coach. It uses IBM Watsonx.ai's Granite language models to
deliver personalized fitness plans, calorie tracking, Indian meal suggestions,
and family wellness guidance — all through a beautiful, responsive chat interface.

### Tech Stack
| Layer      | Technology                            |
|------------|---------------------------------------|
| Backend    | Python 3.10+ / Flask 3.0              |
| AI Engine  | IBM Watsonx.ai — Granite 3.3 8B Instruct |
| Region     | Sydney (au-syd)                        |
| Frontend   | Bootstrap 5 + Vanilla JS              |
| Icons      | Bootstrap Icons                       |
| Fonts      | Google Fonts (Inter + Poppins)        |
| Deployment | Gunicorn (prod) / Flask dev server    |

---

## 📁 Project Structure

```
fitness-buddy/
├── app.py                 ← Flask backend + AGENT_INSTRUCTIONS
├── requirements.txt       ← Python dependencies
├── .env.example           ← Environment variable template
├── README.md              ← This file
├── templates/
│   └── index.html         ← Main single-page application
└── static/
    ├── css/
    │   └── style.css      ← Custom styles + dark mode + responsive
    └── js/
        └── app.js         ← Frontend logic (chat, calculators, UI)
```

---

## 🚀 Quick Start — Local Setup

### Step 1 — Clone or Download the Project
```bash
# If using git
git clone <your-repo-url>
cd fitness-buddy

# Or simply navigate to the project folder
cd fitness-buddy
```

### Step 2 — Create Python Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3 — Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Configure IBM Watsonx.ai Credentials

**Getting your FREE IBM Cloud credentials (Lite plan):**

1. 🌐 Visit **https://cloud.ibm.com** → Sign up (FREE Lite account)
2. 🔑 Go to **Manage → Access (IAM) → API Keys** → Create an API key → Copy it
3. 🤖 Search **"Watson Studio"** in the catalog → Create (Lite plan = FREE)
4. 📁 In Watson Studio: Create a new **Project** → Copy the **Project ID** from the URL
5. ✅ Make sure to enable **Watsonx.ai** services in your project

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your credentials:
# IBM_API_KEY=your_actual_api_key_here
# IBM_PROJECT_ID=your_project_id_here
# IBM_REGION=au-syd
```

Your `.env` file should look like:
```
IBM_API_KEY=abc123xyz...
IBM_PROJECT_ID=12345678-abcd-efgh-ijkl-987654321
IBM_REGION=au-syd
GRANITE_MODEL=ibm/granite-3-3-8b-instruct
FLASK_SECRET_KEY=your-secret-key-here
FLASK_DEBUG=False
PORT=5000
```

### Step 5 — Run the Application
```bash
# Development mode
python app.py

# OR with Flask CLI
flask run --host=0.0.0.0 --port=5000
```

🎉 Open your browser and go to: **http://localhost:5000**

---

## 🎛️ Customizing the AI Agent

Open **`app.py`** and find the `AGENT_INSTRUCTIONS` dictionary near the top.
You can easily customize:

```python
AGENT_INSTRUCTIONS = {
    "tone": "friendly",           # friendly | professional | motivational | strict
    "language": "Hinglish",       # English | Hinglish
    "culture": "Indian",          # Indian | Western | Global
    "diet_specialization": "vegetarian",  # vegetarian | vegan | non-vegetarian | jain | keto
    "workout_type": "home",       # home | gym | outdoor | mixed
    "safety_level": "strict",     # strict | moderate | relaxed
    "yoga_preference": True,      # Include yoga suggestions
    "indian_meal_preference": True, # Suggest Indian foods
    ...
    "system_prompt": "..."        # Full persona — edit to completely reshape the agent
}
```

No other code changes needed — just edit this section!

---

## 🌟 Key Features

| Feature                 | Description                                          |
|-------------------------|------------------------------------------------------|
| 💬 **AI Chat**          | Real-time conversation with IBM Granite model        |
| 📊 **BMI Calculator**   | Instant BMI with health category and ideal weight    |
| 🔥 **Calorie Burner**   | Calculate calories burned for 12+ exercises          |
| 🍽️ **Calorie Counter** | Indian food database with macro breakdown            |
| 🥗 **Meal Planner**     | AI-generated Indian meal plans for any diet/goal     |
| 🏋️ **Workout Planner** | AI-customized routines by level, goal, duration      |
| 👨‍👩‍👧 **Family Profiles** | Per-member fitness plans for all age groups          |
| 🌙 **Dark Mode**        | One-click toggle with persistent preference          |
| 📱 **Mobile Ready**     | Fully responsive with collapsible sidebar            |

---

## 🔧 API Endpoints Reference

| Method | Endpoint                    | Description                           |
|--------|-----------------------------|---------------------------------------|
| POST   | `/api/chat`                 | Send message to AI chatbot            |
| GET    | `/api/profile`              | Get current user profile              |
| POST   | `/api/profile`              | Save user profile                     |
| GET    | `/api/family`               | Get family members                    |
| POST   | `/api/family`               | Save family members                   |
| POST   | `/api/family/plan`          | Generate AI plan for family member    |
| POST   | `/api/calories/calculate`   | Calculate nutrition for food items    |
| POST   | `/api/calories/analyze`     | AI analysis of nutrition intake       |
| POST   | `/api/exercise/calories`    | Calculate calories burned             |
| POST   | `/api/workout/generate`     | Generate AI workout plan              |
| POST   | `/api/meal/suggest`         | Generate AI meal suggestions          |
| POST   | `/api/bmi`                  | Calculate BMI and health assessment   |
| GET    | `/api/status`               | Health check / Watsonx connection     |

---

## 🏭 Production Deployment

### Option A — Gunicorn (Linux/macOS)
```bash
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

### Option B — IBM Code Engine (Recommended)
```bash
# Install IBM Cloud CLI
# https://cloud.ibm.com/docs/cli

ibmcloud login
ibmcloud ce project create --name fitness-buddy
ibmcloud ce app create \
  --name fitness-buddy \
  --image icr.io/your-namespace/fitness-buddy \
  --env IBM_API_KEY=your_key \
  --env IBM_PROJECT_ID=your_project \
  --env IBM_REGION=au-syd
```

### Option C — Railway / Render (One-Click Deploy)
1. Push code to GitHub
2. Connect Railway/Render to your GitHub repo
3. Add environment variables (IBM_API_KEY, IBM_PROJECT_ID, etc.)
4. Deploy!

### Option D — Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```
```bash
docker build -t fitness-buddy .
docker run -p 5000:5000 --env-file .env fitness-buddy
```

---

## 🔒 Security Notes

- Never commit `.env` to version control
- Use a strong, random `FLASK_SECRET_KEY` in production
- Set `FLASK_DEBUG=False` in production
- Consider adding rate limiting for production deployments

---

## 🐛 Troubleshooting

| Issue                          | Solution                                               |
|--------------------------------|--------------------------------------------------------|
| `401 Unauthorized` from Watson | Check IBM_API_KEY is correct and not expired           |
| `404` project not found        | Verify IBM_PROJECT_ID — copy from Watson Studio URL    |
| Model not available            | Ensure Granite model is enabled in your project region |
| Responses are slow             | Normal for first call; model warm-up takes ~10 seconds |
| "Limited Mode" in status bar   | Watsonx not connected — check .env credentials         |

---

## 📞 IBM Support Resources

- 📚 Watson Studio Docs: https://dataplatform.cloud.ibm.com/docs
- 🤖 Watsonx.ai Docs: https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-overview.html
- 💬 IBM Developer Community: https://developer.ibm.com
- 🆓 IBM Cloud Free Tier: https://cloud.ibm.com/registration

---

*Built for IBM Watsonx.ai Hackathon — Problem Statement #13: Fitness Buddy*
*Region: Sydney (au-syd) | Model: IBM Granite 3.3 8B Instruct*
