const form = document.getElementById('triageForm');
const resultsCard = document.getElementById('resultsCard');
const riskBadge = document.getElementById('riskBadge');
const deptName = document.getElementById('deptName');
const metricsDisplay = document.getElementById('metricsDisplay');
const submitBtn = document.getElementById('submitBtn');

// Leave empty initially; we will paste the Render URL here in Step 7
const API_BASE_URL = 'http://127.0.0.1:8000';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerText = 'Evaluating Patient...';

  const payload = {
    Heart_Rate: document.getElementById('heart_rate').value,
    Oxygen_Saturation: document.getElementById('spo2').value,
    Systolic_BP: document.getElementById('systolic').value,
    Diastolic_BP: document.getElementById('diastolic').value,
    Respiratory_Rate: document.getElementById('respiratory').value,
    Body_Temp: document.getElementById('temp').value,
    Age: document.getElementById('age').value,
    Glucose: document.getElementById('glucose').value,
    BMI: document.getElementById('bmi').value,
    Sym_Chest_Pain: document.getElementById('sym_chest_pain').checked ? 1 : 0,
    Sym_Breathless: document.getElementById('sym_breathless').checked ? 1 : 0,
    Sym_High_Thirst: document.getElementById('sym_high_thirst').checked ? 1 : 0
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
    riskBadge.innerText = `${data.predicted_risk_level} Risk`;
    deptName.innerText = data.recommended_department;
    metricsDisplay.innerText = `Mean Arterial Pressure: ${data.clinical_metrics.map} | Pulse Pressure: ${data.clinical_metrics.pulse_pressure}`;

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Could not reach the R API server. Check your connection or Render deployment status.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Assess Health Risk';
  }
});