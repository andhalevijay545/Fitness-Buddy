/**
 * ══════════════════════════════════════════════════════════
 *  FITNESS BUDDY — Frontend JavaScript
 *  IBM Watsonx.ai Powered | Full Feature App
 * ══════════════════════════════════════════════════════════
 */

// ── State ─────────────────────────────────────────────────
const state = {
  foodItems:     [],
  familyMembers: [],
  profile:       {},
  workoutLevel:  "beginner",
  theme:         localStorage.getItem("fb-theme") || "light"
};

// ── DOM Ready ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  initTabs();
  initChat();
  initDashboard();
  initWorkout();
  initCalories();
  initMeals();
  initFamily();
  initProfile();
  initMobileMenu();
  loadProfile();
  checkStatus();
});

// ══════════  THEME  ══════════
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("fb-theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill";
  }
  // Update Bootstrap dark mode
  document.body.classList.toggle("bg-dark", theme === "dark");
}

document.getElementById("themeToggle")?.addEventListener("click", () => {
  applyTheme(state.theme === "dark" ? "light" : "dark");
});

// ══════════  TABS  ══════════
function initTabs() {
  const btns   = document.querySelectorAll(".nav-btn[data-tab]");
  const panels = document.querySelectorAll(".tab-panel");

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      btns.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(`tab-${tab}`);
      if (panel) panel.classList.add("active");
    });
  });
}

// ══════════  API STATUS  ══════════
async function checkStatus() {
  try {
    const res  = await fetch("/api/status");
    const data = await res.json();
    const badge = document.getElementById("statusBadge");
    if (badge) {
      if (data.watsonx_connected) {
        badge.innerHTML = '<span class="status-dot"></span>AI Online';
        badge.style.color = "var(--success)";
      } else {
        badge.innerHTML = '<span class="status-dot" style="background:#f59e0b"></span>Limited Mode';
        badge.style.color = "#f59e0b";
      }
    }
  } catch {
    const badge = document.getElementById("statusBadge");
    if (badge) badge.innerHTML = '<span class="status-dot" style="background:#ef4444"></span>Offline';
  }
}

// ══════════  TOAST HELPER  ══════════
function showToast(msg, type = "success") {
  const toast = document.getElementById("appToast");
  const body  = document.getElementById("toastMessage");
  if (!toast || !body) return;
  body.textContent = msg;
  toast.className = `toast align-items-center border-0 text-bg-${type}`;
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
}

// ══════════  LOADING OVERLAY  ══════════
function showLoading(text = "AI is generating your plan…") {
  const overlay = document.getElementById("loadingOverlay");
  const txt     = document.getElementById("loadingText");
  if (overlay) { overlay.style.display = "flex"; }
  if (txt) txt.textContent = text;
}
function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

// ══════════  MOBILE MENU  ══════════
function initMobileMenu() {
  // Add hamburger button to navbar
  const nav = document.querySelector(".fb-navbar .container-fluid");
  if (nav && window.innerWidth <= 768) {
    const btn = document.createElement("button");
    btn.className = "btn btn-icon mobile-menu-btn me-2";
    btn.innerHTML = '<i class="bi bi-list fs-5"></i>';
    nav.insertBefore(btn, nav.firstChild);
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }
  // Close sidebar on tab click (mobile)
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar")?.classList.remove("open");
      }
    });
  });
}

// ══════════  FORMAT AI RESPONSE (markdown-lite)  ══════════
function formatResponse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3} (.+)$/gm, '<div class="fw-bold mt-3 mb-1" style="font-size:14px;color:var(--accent-primary)">$1</div>')
    .replace(/^[-•] (.+)$/gm, '<div style="padding-left:16px;margin-bottom:3px">• $1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding-left:16px;margin-bottom:3px">$1</div>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ══════════════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════════════
function initChat() {
  const input   = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn= document.getElementById("clearChatBtn");

  // Send on button click
  sendBtn?.addEventListener("click", sendChat);

  // Send on Enter (Shift+Enter = newline)
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });

  // Auto-resize textarea
  input?.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  // Quick action chips
  document.querySelectorAll(".qa-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (input) {
        input.value = chip.dataset.msg;
        sendChat();
      }
    });
  });

  // Clear chat
  clearBtn?.addEventListener("click", async () => {
    await fetch("/api/clear-chat", { method: "POST" });
    const container = document.getElementById("chatMessages");
    if (container) {
      container.innerHTML = "";
      appendBotMessage("Chat cleared! Let's start fresh. How can I help you today? 💪");
    }
  });
}

async function sendChat() {
  const input   = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const message = input?.value.trim();
  if (!message) return;

  // Show user message
  appendUserMessage(message);
  input.value = "";
  input.style.height = "auto";

  // Disable input while waiting
  sendBtn.disabled = true;
  input.disabled   = true;

  // Show typing indicator
  const typingId = appendTypingIndicator();

  try {
    const res  = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, profile: state.profile })
    });
    const data = await res.json();
    removeTypingIndicator(typingId);
    if (data.response) {
      appendBotMessage(data.response, data.timestamp);
    } else {
      appendBotMessage("Sorry, I couldn't process that. Please try again! 🙏");
    }
  } catch {
    removeTypingIndicator(typingId);
    appendBotMessage("⚠️ Connection error. Please check your internet and try again.");
  } finally {
    sendBtn.disabled = false;
    input.disabled   = false;
    input.focus();
  }
}

function appendUserMessage(text) {
  const container = document.getElementById("chatMessages");
  const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const div = document.createElement("div");
  div.className = "message user-message";
  div.innerHTML = `
    <div class="msg-avatar"><i class="bi bi-person-fill"></i></div>
    <div class="msg-bubble">
      <span>${escapeHtml(text)}</span>
      <span class="msg-time">${time}</span>
    </div>`;
  container.appendChild(div);
  scrollChatToBottom();
}

function appendBotMessage(text, timestamp) {
  const container = document.getElementById("chatMessages");
  const time = timestamp || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const div = document.createElement("div");
  div.className = "message bot-message";
  div.innerHTML = `
    <div class="msg-avatar"><i class="bi bi-heart-pulse-fill"></i></div>
    <div class="msg-bubble">
      <div>${formatResponse(text)}</div>
      <span class="msg-time">${time}</span>
    </div>`;
  container.appendChild(div);
  scrollChatToBottom();
}

function appendTypingIndicator() {
  const container = document.getElementById("chatMessages");
  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.className = "message bot-message";
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar"><i class="bi bi-heart-pulse-fill"></i></div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>`;
  container.appendChild(div);
  scrollChatToBottom();
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function scrollChatToBottom() {
  const container = document.getElementById("chatMessages");
  if (container) container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function initDashboard() {
  // BMI Calculator
  document.getElementById("calcBmiBtn")?.addEventListener("click", calculateBMI);

  // Calorie Burn Calculator
  document.getElementById("calcBurnBtn")?.addEventListener("click", calcCalorieBurn);
}

async function calculateBMI() {
  const weight = parseFloat(document.getElementById("bmiWeight")?.value);
  const height = parseFloat(document.getElementById("bmiHeight")?.value);
  const age    = parseInt(document.getElementById("bmiAge")?.value) || 25;

  if (!weight || !height || weight < 20 || height < 100) {
    showToast("Please enter valid weight and height", "warning");
    return;
  }

  try {
    const res  = await fetch("/api/bmi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, height, age })
    });
    const data = await res.json();
    displayBMI(data);
  } catch {
    showToast("Error calculating BMI", "danger");
  }
}

function displayBMI(data) {
  document.getElementById("bmiResultCard").style.removeProperty("display");
  document.getElementById("bmiPlaceholder").style.display = "none";

  const circle = document.getElementById("bmiCircle");
  circle.style.borderColor = data.color;
  document.getElementById("bmiNumber").textContent = data.bmi;
  const catEl = document.getElementById("bmiCategory");
  catEl.textContent = data.category;
  catEl.style.color = data.color;
  document.getElementById("bmiAdvice").textContent = data.advice;
  document.getElementById("idealWeight").innerHTML =
    `<span class="text-success">✓ Ideal weight range: ${data.ideal_weight_min}–${data.ideal_weight_max} kg</span>`;

  // Update sidebar
  document.getElementById("sideBmiVal").textContent = `BMI: ${data.bmi}`;
}

async function calcCalorieBurn() {
  const exercise = document.getElementById("exerciseType")?.value;
  const duration = parseFloat(document.getElementById("exerciseDuration")?.value) || 30;
  const weight   = parseFloat(document.getElementById("exerciseWeight")?.value)
                   || state.profile.weight || 65;

  try {
    const res  = await fetch("/api/exercise/calories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise, duration, weight })
    });
    const data = await res.json();
    document.getElementById("burnCalories").textContent = data.calories_burned;
    document.getElementById("burnResult").style.display = "block";
  } catch {
    showToast("Error calculating burn", "danger");
  }
}

// ══════════════════════════════════════════════════════════
//  WORKOUT PLANNER
// ══════════════════════════════════════════════════════════
function initWorkout() {
  // Fitness level buttons
  document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.workoutLevel = btn.dataset.level;
    });
  });

  // Duration slider label
  const slider = document.getElementById("workoutDuration");
  slider?.addEventListener("input", () => {
    const label = document.getElementById("durationLabel");
    if (label) label.textContent = slider.value + " min";
  });

  // Generate workout
  document.getElementById("generateWorkoutBtn")?.addEventListener("click", generateWorkout);

  // Copy workout
  document.getElementById("copyWorkoutBtn")?.addEventListener("click", () => {
    const text = document.getElementById("workoutResult")?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast("Workout plan copied! 📋", "success");
    }
  });
}

async function generateWorkout() {
  const goal       = document.getElementById("workoutGoal")?.value;
  const focusArea  = document.getElementById("focusArea")?.value;
  const duration   = document.getElementById("workoutDuration")?.value;
  const equipment  = document.getElementById("equipment")?.value;

  showLoading("Generating your personalized workout plan…");

  try {
    const res  = await fetch("/api/workout/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal,
        fitness_level: state.workoutLevel,
        focus_area: focusArea,
        duration: parseInt(duration),
        equipment,
        age: state.profile.age || 25
      })
    });
    const data = await res.json();
    const result = document.getElementById("workoutResult");
    const copyBtn= document.getElementById("copyWorkoutBtn");
    if (result && data.workout) {
      result.innerHTML = formatResponse(data.workout);
      if (copyBtn) copyBtn.style.display = "inline-block";
    }
  } catch {
    showToast("Error generating workout. Check your connection.", "danger");
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════
//  CALORIE CALCULATOR
// ══════════════════════════════════════════════════════════
function initCalories() {
  document.getElementById("addFoodBtn")?.addEventListener("click", addFoodItem);
  document.getElementById("calcNutritionBtn")?.addEventListener("click", calculateNutrition);
  document.getElementById("clearFoodBtn")?.addEventListener("click", clearFoodList);
  document.getElementById("analyzeNutritionBtn")?.addEventListener("click", analyzeNutrition);

  // Food name input — Enter key
  document.getElementById("foodName")?.addEventListener("keydown", e => {
    if (e.key === "Enter") addFoodItem();
  });

  // Quick-add food tags
  document.querySelectorAll(".food-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      const name = tag.dataset.food;
      const qty  = parseFloat(tag.dataset.qty) || 1;
      addFoodToList(name, qty);
    });
  });
}

function addFoodItem() {
  const nameInput = document.getElementById("foodName");
  const qtyInput  = document.getElementById("foodQty");
  const name = nameInput?.value.trim();
  const qty  = parseFloat(qtyInput?.value) || 1;
  if (!name) { showToast("Please enter a food name", "warning"); return; }
  addFoodToList(name, qty);
  nameInput.value = "";
  qtyInput.value  = "1";
}

function addFoodToList(name, qty) {
  state.foodItems.push({ name, quantity: qty });
  renderFoodList();
}

function renderFoodList() {
  const list = document.getElementById("foodList");
  if (!list) return;
  list.innerHTML = state.foodItems.map((item, i) => `
    <div class="food-item">
      <span class="food-item-name">🍽️ ${item.name} <span class="text-muted">×${item.quantity}</span></span>
      <button class="food-item-remove" onclick="removeFoodItem(${i})">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>`).join("");
}

function removeFoodItem(index) {
  state.foodItems.splice(index, 1);
  renderFoodList();
}

function clearFoodList() {
  state.foodItems = [];
  renderFoodList();
  document.getElementById("nutritionResultCard").style.display = "none";
  document.getElementById("nutritionAnalysisCard").style.display = "none";
  document.getElementById("caloriePlaceholder").style.display = "block";
}

async function calculateNutrition() {
  if (state.foodItems.length === 0) {
    showToast("Please add some food items first", "warning");
    return;
  }
  try {
    const res  = await fetch("/api/calories/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: state.foodItems })
    });
    const data = await res.json();
    displayNutrition(data);
  } catch {
    showToast("Error calculating nutrition", "danger");
  }
}

function displayNutrition(data) {
  const resultCard = document.getElementById("nutritionResultCard");
  const analysisCard = document.getElementById("nutritionAnalysisCard");
  const placeholder  = document.getElementById("caloriePlaceholder");

  resultCard.style.display   = "block";
  analysisCard.style.display = "block";
  placeholder.style.display  = "none";

  const t = data.totals;

  // Macro summary boxes
  document.getElementById("macroGrid").innerHTML = `
    <div class="macro-item">
      <div class="macro-value macro-cal">${t.calories}</div>
      <div class="macro-label">kcal</div>
    </div>
    <div class="macro-item">
      <div class="macro-value macro-prot">${t.protein}g</div>
      <div class="macro-label">Protein</div>
    </div>
    <div class="macro-item">
      <div class="macro-value macro-carb">${t.carbs}g</div>
      <div class="macro-label">Carbs</div>
    </div>
    <div class="macro-item">
      <div class="macro-value macro-fat">${t.fat}g</div>
      <div class="macro-label">Fat</div>
    </div>`;

  // Macro bars — assuming 2000 cal / 50g protein / 250g carbs / 65g fat daily
  const pPct = Math.min(100, Math.round((t.protein / 50) * 100));
  const cPct = Math.min(100, Math.round((t.carbs / 250) * 100));
  const fPct = Math.min(100, Math.round((t.fat / 65) * 100));

  document.getElementById("macroBars").innerHTML = `
    <div class="macro-bar-row">
      <div class="macro-bar-label">Protein</div>
      <div class="macro-bar-track"><div class="macro-bar-fill bar-protein" style="width:${pPct}%"></div></div>
      <div class="macro-bar-val">${t.protein}g</div>
    </div>
    <div class="macro-bar-row">
      <div class="macro-bar-label">Carbs</div>
      <div class="macro-bar-track"><div class="macro-bar-fill bar-carbs" style="width:${cPct}%"></div></div>
      <div class="macro-bar-val">${t.carbs}g</div>
    </div>
    <div class="macro-bar-row">
      <div class="macro-bar-label">Fat</div>
      <div class="macro-bar-track"><div class="macro-bar-fill bar-fat" style="width:${fPct}%"></div></div>
      <div class="macro-bar-val">${t.fat}g</div>
    </div>`;

  // Update sidebar daily calorie stat
  document.getElementById("dashCalories").textContent = t.calories.toLocaleString();

  // Store totals for AI analysis
  state.lastNutritionTotals = t;
  document.getElementById("nutritionAnalysis").innerHTML =
    '<div class="text-muted small">Click "Analyze with AI" for personalized nutrition feedback</div>';
}

async function analyzeNutrition() {
  if (!state.lastNutritionTotals) {
    showToast("Calculate nutrition first", "warning");
    return;
  }
  showLoading("Analyzing your nutrition with AI…");
  try {
    const res  = await fetch("/api/calories/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totals: state.lastNutritionTotals })
    });
    const data = await res.json();
    document.getElementById("nutritionAnalysis").innerHTML = formatResponse(data.analysis);
  } catch {
    showToast("Error analyzing nutrition", "danger");
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════
//  MEAL PLANNER
// ══════════════════════════════════════════════════════════
function initMeals() {
  // Calorie slider label
  const slider = document.getElementById("mealCalTarget");
  slider?.addEventListener("input", () => {
    const label = document.getElementById("mealCalLabel");
    if (label) label.textContent = parseInt(slider.value).toLocaleString();
  });

  document.getElementById("generateMealBtn")?.addEventListener("click", generateMeal);

  document.getElementById("copyMealBtn")?.addEventListener("click", () => {
    const text = document.getElementById("mealResult")?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast("Meal plan copied! 📋", "success");
    }
  });
}

async function generateMeal() {
  const diet       = document.getElementById("mealDiet")?.value;
  const goal       = document.getElementById("mealGoal")?.value;
  const calories   = parseInt(document.getElementById("mealCalTarget")?.value) || 1800;
  const mealType   = document.getElementById("mealType")?.value;

  showLoading("Crafting your personalized Indian meal plan…");

  try {
    const res  = await fetch("/api/meal/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal_type: mealType, target_calories: calories, preferences: diet, goal })
    });
    const data = await res.json();
    const result = document.getElementById("mealResult");
    const copyBtn= document.getElementById("copyMealBtn");
    if (result && data.suggestions) {
      result.innerHTML = formatResponse(data.suggestions);
      if (copyBtn) copyBtn.style.display = "inline-block";
    }
  } catch {
    showToast("Error generating meal plan", "danger");
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════
//  FAMILY PROFILES
// ══════════════════════════════════════════════════════════
function initFamily() {
  document.getElementById("addFamilyBtn")?.addEventListener("click", addFamilyMember);
}

function addFamilyMember() {
  const name   = document.getElementById("famName")?.value.trim();
  const age    = parseInt(document.getElementById("famAge")?.value);
  const gender = document.getElementById("famGender")?.value;
  const health = document.getElementById("famHealth")?.value.trim();

  if (!name || !age) {
    showToast("Name and age are required", "warning");
    return;
  }

  const member = { name, age, gender, health_conditions: health || "None", goal: "general wellness", diet: "Vegetarian" };
  state.familyMembers.push(member);
  renderFamilyList();

  // Clear inputs
  ["famName","famAge","famHealth"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  showToast(`${name} added to family! 👨‍👩‍👧`, "success");
  saveFamilyToServer();
}

function getAvatarBg(age, gender) {
  if (age <= 12)  return "linear-gradient(135deg, #f59e0b, #d97706)";
  if (age >= 60)  return "linear-gradient(135deg, #8b5cf6, #7c3aed)";
  if (gender === "female") return "linear-gradient(135deg, #ec4899, #db2777)";
  return "linear-gradient(135deg, #3b82f6, #2563eb)";
}

function getAgeGroup(age) {
  if (age <= 12)  return { label: "Child",  color: "#f59e0b" };
  if (age <= 17)  return { label: "Teen",   color: "#22c55e" };
  if (age <= 59)  return { label: "Adult",  color: "#3b82f6" };
  return              { label: "Senior", color: "#8b5cf6" };
}

function renderFamilyList() {
  const container = document.getElementById("familyList");
  if (!container) return;

  if (state.familyMembers.length === 0) {
    container.innerHTML = `<div class="col-12"><div class="empty-state card fb-card">
      <div class="card-body text-center text-muted py-4">
        <i class="bi bi-people" style="font-size:3rem;opacity:.3"></i>
        <p class="mt-2">No family members added yet.</p>
      </div></div></div>`;
    return;
  }

  container.innerHTML = state.familyMembers.map((m, i) => {
    const ageGroup = getAgeGroup(m.age);
    const avatarBg = getAvatarBg(m.age, m.gender);
    const icon     = m.age <= 12 ? "bi-star-fill" : m.age >= 60 ? "bi-heart-fill" : m.gender === "female" ? "bi-person-fill" : "bi-person-fill";
    return `
    <div class="col-md-4 col-sm-6">
      <div class="family-card">
        <div class="family-avatar" style="background:${avatarBg}">
          <i class="bi ${icon}"></i>
        </div>
        <div class="family-name">${m.name}</div>
        <div class="family-detail">
          ${m.age} years • ${m.gender} 
          ${m.health_conditions !== "None" ? `<br><small class="text-muted">⚠️ ${m.health_conditions}</small>` : ""}
        </div>
        <div class="family-badge" style="background:${ageGroup.color}22;color:${ageGroup.color}">
          ${ageGroup.label}
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-sm btn-primary flex-grow-1" onclick="getFamilyPlan(${i})">
            <i class="bi bi-stars me-1"></i>Get Plan
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="removeFamilyMember(${i})">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function removeFamilyMember(index) {
  state.familyMembers.splice(index, 1);
  renderFamilyList();
  saveFamilyToServer();
}

async function getFamilyPlan(index) {
  const member = state.familyMembers[index];
  showLoading(`Creating fitness plan for ${member.name}…`);

  try {
    const res  = await fetch("/api/family/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member })
    });
    const data = await res.json();
    const planCard = document.getElementById("familyPlanCard");
    const planResult = document.getElementById("familyPlanResult");
    if (planCard && planResult && data.plan) {
      planCard.style.display = "block";
      planResult.innerHTML   = `<div class="mb-2 fw-bold text-primary">📋 Plan for ${data.member}:</div>` + formatResponse(data.plan);
      planCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch {
    showToast("Error generating plan", "danger");
  } finally {
    hideLoading();
  }
}

async function saveFamilyToServer() {
  try {
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: state.familyMembers })
    });
  } catch { /* silent */ }
}

// ══════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════
function initProfile() {
  document.getElementById("saveProfileBtn")?.addEventListener("click", saveProfile);
}

async function saveProfile() {
  const profile = {
    name:             document.getElementById("profileName")?.value.trim(),
    age:              parseInt(document.getElementById("profileAge")?.value) || null,
    gender:           document.getElementById("profileGender")?.value,
    weight:           parseFloat(document.getElementById("profileWeight")?.value) || null,
    height:           parseFloat(document.getElementById("profileHeight")?.value) || null,
    activity:         document.getElementById("profileActivity")?.value,
    goal:             document.getElementById("profileGoal")?.value,
    diet:             document.getElementById("profileDiet")?.value,
    health_conditions:document.getElementById("profileHealth")?.value.trim() || "None"
  };

  state.profile = profile;

  // Update nav name
  const navName = document.getElementById("navProfileName");
  if (navName && profile.name) navName.textContent = profile.name;

  // Update sidebar goal
  const sideGoal = document.getElementById("sideGoalVal");
  if (sideGoal && profile.goal) sideGoal.textContent = `Goal: ${profile.goal}`;

  // Pre-fill exercise weight
  if (profile.weight) {
    const exerciseWeightEl = document.getElementById("exerciseWeight");
    if (exerciseWeightEl) exerciseWeightEl.value = profile.weight;
    const bmiWeightEl = document.getElementById("bmiWeight");
    if (bmiWeightEl && !bmiWeightEl.value) bmiWeightEl.value = profile.weight;
    const bmiHeightEl = document.getElementById("bmiHeight");
    if (bmiHeightEl && !bmiHeightEl.value && profile.height) bmiHeightEl.value = profile.height;
    const bmiAgeEl = document.getElementById("bmiAge");
    if (bmiAgeEl && !bmiAgeEl.value && profile.age) bmiAgeEl.value = profile.age;
  }

  try {
    const res  = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    showToast(data.message || "Profile saved! 🎉", "success");
    const modal = bootstrap.Modal.getInstance(document.getElementById("profileModal"));
    modal?.hide();
  } catch {
    showToast("Error saving profile", "danger");
  }
}

async function loadProfile() {
  try {
    const res  = await fetch("/api/profile");
    const data = await res.json();
    if (data && data.name) {
      state.profile = data;
      // Populate modal fields
      const fields = {
        profileName:     data.name,
        profileAge:      data.age,
        profileGender:   data.gender,
        profileWeight:   data.weight,
        profileHeight:   data.height,
        profileActivity: data.activity,
        profileGoal:     data.goal,
        profileDiet:     data.diet,
        profileHealth:   data.health_conditions
      };
      Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
      });
      // Update nav
      const navName = document.getElementById("navProfileName");
      if (navName) navName.textContent = data.name;
      const sideGoal = document.getElementById("sideGoalVal");
      if (sideGoal && data.goal) sideGoal.textContent = `Goal: ${data.goal}`;
    }

    // Load family
    const famRes = await fetch("/api/family");
    const famData = await famRes.json();
    if (famData.members && famData.members.length > 0) {
      state.familyMembers = famData.members;
      renderFamilyList();
    }
  } catch { /* silent on first load */ }
}
