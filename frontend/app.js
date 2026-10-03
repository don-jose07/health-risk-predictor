const API_BASE_URL = 'https://health-risk-predictor-gyf6.onrender.com';

const SYMPTOMS_DATABASE = [
  // Cardiovascular & Respiratory
  { id: "chest_pain", name: "Chest Pain / Pressure / Tightness" },
  { id: "shortness_of_breath", name: "Shortness of Breath (Dyspnea)" },
  { id: "severe_dyspnea", name: "Severe Difficulty Breathing at Rest" },
  { id: "palpitations", name: "Heart Palpitations / Fluttering" },
  { id: "irregular_heartbeat", name: "Irregular Heart Rhythm" },
  { id: "left_arm_pain", name: "Pain Radiating to Left Arm / Jaw" },
  { id: "edema_legs", name: "Swollen Ankles / Legs (Edema)" },
  { id: "persistent_cough", name: "Persistent Cough" },
  { id: "wheezing", name: "Wheezing / Whistling Breath" },
  { id: "hemoptysis", name: "Coughing Up Blood" },
  { id: "cyanosis", name: "Bluish Skin / Lips (Cyanosis)" },
  
  // Neurological
  { id: "severe_headache", name: "Severe Sudden Headache" },
  { id: "dizziness_vertigo", name: "Dizziness / Lightheadedness" },
  { id: "blurred_vision", name: "Blurred or Double Vision" },
  { id: "confusion_altered_mental", name: "Acute Confusion / Disorientation" },
  { id: "speech_difficulty", name: "Slurred Speech" },
  { id: "numbness_tingling", name: "Numbness or Tingling in Limbs" },
  { id: "loss_of_consciousness", name: "Fainting / Syncope" },
  { id: "seizures", name: "Seizures / Convulsions" },

  // Metabolic & Endocrine
  { id: "excessive_thirst", name: "Excessive Thirst (Polydipsia)" },
  { id: "frequent_urination", name: "Frequent Urination (Polyuria)" },
  { id: "unexplained_weight_loss", name: "Rapid Weight Loss" },
  { id: "sweet_breath", name: "Sweet / Acetone Breath" },

  // Gastrointestinal & Systemic
  { id: "nausea_vomiting", name: "Nausea / Vomiting" },
  { id: "severe_abdominal_pain", name: "Severe Abdominal Pain" },
  { id: "diarrhea", name: "Persistent Diarrhea" },
  { id: "jaundice", name: "Yellowing Eyes / Skin (Jaundice)" },
  { id: "loss_of_appetite", name: "Loss of Appetite" },
  { id: "high_fever", name: "High Fever" },
  { id: "chills_rigors", name: "Chills / Shivering" },
  { id: "cold_sweats", name: "Cold Sweats (Diaphoresis)" },
  { id: "profound_fatigue", name: "Profound Fatigue / Weakness" },
  { id: "muscle_joint_aches", name: "Severe Muscle / Joint Aches" },
  { id: "sore_throat", name: "Severe Sore Throat" }
];

const FREQUENT_CHIPS = [
  "chest_pain", "shortness_of_breath", "high_fever", 
  "severe_headache", "dizziness_vertigo", "excessive_thirst", "nausea_vomiting"
];

let selectedSymptoms = new Set();

// Render Quick-Add Chips
const quickChipsContainer = document.getElementById('quickChipsContainer');
function renderQuickChips() {
  quickChipsContainer.innerHTML = '';
  FREQUENT_CHIPS.forEach(id => {
    const item = SYMPTOMS_DATABASE.find(s => s.id === id);
    if (!item) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip-btn ${selectedSymptoms.has(id) ? 'active' : ''}`;
    btn.textContent = (selectedSymptoms.has(id) ? '✓ ' : '+ ') + item.name;
    btn.onclick = () => {
      toggleSymptom(item);
      renderQuickChips();
    };
    quickChipsContainer.appendChild(btn);
  });
}
renderQuickChips();

// Pill-Style NIL Toggles
document.querySelectorAll('.nil-toggle').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const targetInput = document.getElementById(e.target.dataset.target);
    const parentLabel = document.getElementById('label_' + e.target.dataset.target);
    
    if (e.target.checked) {
      parentLabel.classList.add('active');
      targetInput.dataset.prevVal = targetInput.value;
      targetInput.value = '';
      targetInput.disabled = true;
      targetInput.placeholder = 'NIL (Population Median)';
    } else {
      parentLabel.classList.remove('active');
      targetInput.value = targetInput.dataset.prevVal || '';
      targetInput.disabled = false;
      targetInput.placeholder = '';
    }
  });
});

// Dropdown & Search Logic
const searchInput = document.getElementById('symptomSearchInput');
const dropdown = document.getElementById('symptomsDropdown');
const tagsContainer = document.getElementById('selectedTags');

function renderDropdown(items) {
  dropdown.innerHTML = '';
  if (items.length === 0) {
    dropdown.innerHTML = '<div class="dropdown-item empty">No matching symptoms found</div>';
    dropdown.style.display = 'block';
    return;
  }
  items.forEach(item => {
    const isSelected = selectedSymptoms.has(item.id);
    const div = document.createElement('div');
    div.className = `dropdown-item ${isSelected ? 'selected' : ''}`;
    div.innerHTML = `<span>${item.name}</span> <span>${isSelected ? '✓' : '+'}</span>`;
    div.onclick = () => {
      toggleSymptom(item);
      renderQuickChips();
    };
    dropdown.appendChild(div);
  });
  dropdown.style.display = 'block';
}

function renderTags() {
  tagsContainer.innerHTML = '';
  selectedSymptoms.forEach(id => {
    const item = SYMPTOMS_DATABASE.find(s => s.id === id);
    if (!item) return;
    const tag = document.createElement('span');
    tag.className = 'symptom-tag';
    tag.innerHTML = `${item.name} <span class="tag-remove" onclick="removeSymptom('${item.id}')">&times;</span>`;
    tagsContainer.appendChild(tag);
  });
}

function toggleSymptom(item) {
  if (selectedSymptoms.has(item.id)) {
    selectedSymptoms.delete(item.id);
  } else {
    selectedSymptoms.add(item.id);
  }
  renderTags();
  renderQuickChips();
  searchInput.value = '';
  dropdown.style.display = 'none';
}

window.removeSymptom = function(id) {
  selectedSymptoms.delete(id);
  renderTags();
  renderQuickChips();
};

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    dropdown.style.display = 'none';
    return;
  }
  const filtered = SYMPTOMS_DATABASE.filter(s => s.name.toLowerCase().includes(query));
  renderDropdown(filtered);
});

searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) {
    const filtered = SYMPTOMS_DATABASE.filter(s => s.name.toLowerCase().includes(searchInput.value.toLowerCase().trim()));
    renderDropdown(filtered);
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.symptom-search-container')) {
    dropdown.style.display = 'none';
  }
});

// Department Icon Map
const DEPT_ICONS = {
  "Emergency": "🚨",
  "Cardiology": "🫀",
  "Pulmonology": "🫁",
  "Endocrinology": "🩸",
  "Neurology": "🧠",
  "Gastroenterology": "🔬",
  "Infectious": "🦠",
  "General": "👨‍⚕️"
};

function getDepartmentIcon(dept) {
  for (const [key, icon] of Object.entries(DEPT_ICONS)) {
    if (dept.includes(key)) return icon;
  }
  return "🏥";
}

// Form Submission & API Call
const form = document.getElementById('triageForm');
const resultsCard = document.getElementById('resultsCard');
const riskBadge = document.getElementById('riskBadge');
const deptName = document.getElementById('deptName');
const deptIcon = document.getElementById('deptIcon');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerText = 'Analyzing Vitals & Running Prediction...';

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el.disabled || el.value.trim() === '' ? null : el.value;
  };

  const payload = {
    Heart_Rate:        getVal('heart_rate'),
    Oxygen_Saturation: getVal('spo2'),
    Systolic_BP:       getVal('systolic'),
    Diastolic_BP:      getVal('diastolic'),
    Respiratory_Rate:  getVal('respiratory'),
    Body_Temp:         getVal('temp'),
    Age:               getVal('age'),
    Glucose:           getVal('glucose'),
    BMI:               getVal('bmi'),
    Symptoms:          Array.from(selectedSymptoms)
  };

  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('API server returned error');
    const data = await res.json();

    // Update Card Border and Status Badge
    resultsCard.className = `card result-card risk-border-${data.predicted_risk_level}`;
    riskBadge.className = `status-badge status-${data.predicted_risk_level}`;
    riskBadge.innerText = `${data.predicted_risk_level} Risk (Index: ${data.severity_score})`;

    // Update Department & Icon
    deptName.innerText = data.recommended_department;
    deptIcon.innerText = getDepartmentIcon(data.recommended_department);

    // Update Metrics
    document.getElementById('val_spo2').innerText = data.imputed_vitals.spo2;
    document.getElementById('val_bp').innerText = data.imputed_vitals.bp;
    document.getElementById('val_map').innerText = data.imputed_vitals.map;
    document.getElementById('val_glucose').innerText = data.imputed_vitals.glucose;
    document.getElementById('val_symptoms_count').innerText = data.symptoms_evaluated_count;

    document.getElementById('evaluationTimestamp').innerText = `Evaluated at ${new Date().toLocaleTimeString()}`;

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Could not reach the R API server. If Render has entered sleep mode, wait 30 seconds for it to wake and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Run Clinical Risk Assessment';
  }
});
