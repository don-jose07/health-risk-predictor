const API_BASE_URL = 'https://health-risk-predictor-gyf6.onrender.com';

const SYMPTOMS_DATABASE = [
  { id: "chest_pain", name: "Chest Pain / Pressure / Tightness" },
  { id: "shortness_of_breath", name: "Shortness of Breath (Dyspnea)" },
  { id: "severe_dyspnea", name: "Severe Difficulty Breathing at Rest" },
  { id: "palpitations", name: "Heart Palpitations / Fluttering" },
  { id: "irregular_heartbeat", name: "Irregular Heart Rhythm" },
  { id: "left_arm_pain", name: "Pain Radiating to Left Arm / Jaw" },
  { id: "edema_legs", name: "Swollen Ankles / Legs (Edema)" },
  { id: "persistent_cough", name: "Persistent Dry or Productive Cough" },
  { id: "wheezing", name: "Wheezing / Whistling Breath" },
  { id: "hemoptysis", name: "Coughing Up Blood (Hemoptysis)" },
  { id: "cyanosis", name: "Bluish Skin / Lips (Cyanosis)" },
  { id: "severe_headache", name: "Severe Sudden Headache / Migraine" },
  { id: "dizziness_vertigo", name: "Dizziness / Vertigo / Lightheadedness" },
  { id: "blurred_vision", name: "Blurred or Double Vision" },
  { id: "confusion_altered_mental", name: "Acute Confusion / Disorientation" },
  { id: "speech_difficulty", name: "Slurred or Difficult Speech" },
  { id: "numbness_tingling", name: "Facial / Limb Numbness or Tingling" },
  { id: "loss_of_consciousness", name: "Fainting / Syncope / Blackout" },
  { id: "seizures", name: "Seizures / Uncontrolled Jerking" },
  { id: "tremors", name: "Hand Tremors / Shaking" },
  { id: "excessive_thirst", name: "Excessive Thirst (Polydipsia)" },
  { id: "frequent_urination", name: "Frequent Urination (Polyuria)" },
  { id: "unexplained_weight_loss", name: "Rapid Unexplained Weight Loss" },
  { id: "sweet_breath", name: "Fruity or Sweet Smelling Breath" },
  { id: "nausea_vomiting", name: "Nausea / Vomiting" },
  { id: "severe_abdominal_pain", name: "Severe Abdominal Pain / Cramps" },
  { id: "diarrhea", name: "Persistent Diarrhea" },
  { id: "jaundice", name: "Yellowing Skin / Eyes (Jaundice)" },
  { id: "loss_of_appetite", name: "Complete Loss of Appetite" },
  { id: "acid_reflux", name: "Severe Heartburn / Acid Reflux" },
  { id: "high_fever", name: "High Fever" },
  { id: "chills_rigors", name: "Chills / Rigors / Shivering" },
  { id: "cold_sweats", name: "Profuse Cold Sweats (Diaphoresis)" },
  { id: "profound_fatigue", name: "Profound Fatigue / Inability to Stand" },
  { id: "muscle_joint_aches", name: "Severe Muscle / Joint Aches" },
  { id: "sore_throat", name: "Severe Sore Throat / Trouble Swallowing" }
];

let selectedSymptoms = new Set();

document.querySelectorAll('.nil-toggle').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const targetInput = document.getElementById(e.target.dataset.target);
    if (e.target.checked) {
      targetInput.dataset.prevVal = targetInput.value;
      targetInput.value = '';
      targetInput.disabled = true;
      targetInput.placeholder = 'NIL (Auto-Imputed)';
    } else {
      targetInput.value = targetInput.dataset.prevVal || '';
      targetInput.disabled = false;
      targetInput.placeholder = '';
    }
  });
});

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
    div.textContent = item.name;
    div.onclick = () => toggleSymptom(item);
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
  searchInput.value = '';
  dropdown.style.display = 'none';
}

window.removeSymptom = function(id) {
  selectedSymptoms.delete(id);
  renderTags();
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

const form = document.getElementById('triageForm');
const resultsCard = document.getElementById('resultsCard');
const riskBadge = document.getElementById('riskBadge');
const deptName = document.getElementById('deptName');
const metricsDisplay = document.getElementById('metricsDisplay');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerText = 'Evaluating Patient...';

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

    riskBadge.className = `badge badge-${data.predicted_risk_level}`;
    riskBadge.innerText = `${data.predicted_risk_level} Risk (Score: ${data.severity_score})`;
    deptName.innerText = data.recommended_department;
    metricsDisplay.innerText = `Evaluated Vitals: SpO2: ${data.imputed_vitals.spo2} | BP: ${data.imputed_vitals.bp} | MAP: ${data.imputed_vitals.map} | Symptoms Evaluated: ${data.symptoms_evaluated_count}`;

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Could not reach the R API server. If Render has entered sleep mode, wait 30 seconds for it to wake and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Assess Health Risk & Department';
  }
});
