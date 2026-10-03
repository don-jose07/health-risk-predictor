const form = document.getElementById('triageForm');
const resultsCard = document.getElementById('resultsCard');
const riskBadge = document.getElementById('riskBadge');
const deptName = document.getElementById('deptName');
const metricsDisplay = document.getElementById('metricsDisplay');
const submitBtn = document.getElementById('submitBtn');

const API_BASE_URL = 'https://health-risk-predictor-gyf6.onrender.com';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerText = 'Evaluating Patient...';

  const payload = {
    // Vitals & Biomarkers
    Heart_Rate: document.getElementById('heart_rate').value,
    Oxygen_Saturation: document.getElementById('spo2').value,
    Systolic_BP: document.getElementById('systolic').value,
    Diastolic_BP: document.getElementById('diastolic').value,
    Respiratory_Rate: document.getElementById('respiratory').value,
    Body_Temp: document.getElementById('temp').value,
    Age: document.getElementById('age').value,
    Glucose: document.getElementById('glucose').value,
    BMI: document.getElementById('bmi').value,

    // Full 17 Clinical Symptoms
    Sym_Chest_Pain:          document.getElementById('sym_chest_pain').checked ? 1 : 0,
    Sym_Breathless:          document.getElementById('sym_breathless').checked ? 1 : 0,
    Sym_Palpitations:        document.getElementById('sym_palpitations').checked ? 1 : 0,
    Sym_Cough:               document.getElementById('sym_cough').checked ? 1 : 0,
    Sym_Wheezing:            document.getElementById('sym_wheezing').checked ? 1 : 0,
    Sym_High_Thirst:         document.getElementById('sym_high_thirst').checked ? 1 : 0,
    Sym_Frequent_Urination:  document.getElementById('sym_frequent_urination').checked ? 1 : 0,
    Sym_Severe_Headache:     document.getElementById('sym_severe_headache').checked ? 1 : 0,
    Sym_Dizziness:           document.getElementById('sym_dizziness').checked ? 1 : 0,
    Sym_Blurred_Vision:      document.getElementById('sym_blurred_vision').checked ? 1 : 0,
    Sym_Confusion:           document.getElementById('sym_confusion').checked ? 1 : 0,
    Sym_Nausea:              document.getElementById('sym_nausea').checked ? 1 : 0,
    Sym_Abdominal_Pain:      document.getElementById('sym_abdominal_pain').checked ? 1 : 0,
    Sym_Fever:               document.getElementById('sym_fever').checked ? 1 : 0,
    Sym_Chills:              document.getElementById('sym_chills').checked ? 1 : 0,
    Sym_Fatigue:             document.getElementById('sym_fatigue').checked ? 1 : 0,
    Sym_Sweating:            document.getElementById('sym_sweating').checked ? 1 : 0
  };

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('API server returned an error');

    const data = await response.json();

    riskBadge.className = `badge badge-${data.predicted_risk_level}`;
    riskBadge.innerText = `${data.predicted_risk_level} Risk (Score: ${data.severity_score})`;
    deptName.innerText = data.recommended_department;
    metricsDisplay.innerText = `Mean Arterial Pressure: ${data.clinical_metrics.map} | Pulse Pressure: ${data.clinical_metrics.pulse_pressure}`;

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Could not reach the R API server. If Render has entered sleep mode, wait 30 seconds for it to wake and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Assess Health Risk & Recommend Department';
  }
});