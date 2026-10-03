library(plumber)

#* Enable CORS for Vercel Frontend
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

# -------------------------------------------------------------------------
# Comprehensive Department Recommendation Engine
# -------------------------------------------------------------------------
recommend_department <- function(v, risk) {
  # 1. Critical / Emergency Care (ER)
  # Unstable vitals or red-flag acute distress symptoms
  if (risk == "High" && (
    v$Oxygen_Saturation < 90 || 
    v$Systolic_BP >= 180 || 
    v$Systolic_BP < 90 ||
    v$Heart_Rate > 130 ||
    v$Heart_Rate < 45 ||
    v$Sym_Chest_Pain == 1 ||
    v$Sym_Confusion == 1
  )) {
    return("Emergency Medicine (ER / ICU)")
  }
  
  # 2. Cardiology
  if (v$Sym_Chest_Pain == 1 || 
      v$Sym_Palpitations == 1 || 
      v$Systolic_BP >= 140 || 
      (v$Sym_Sweating == 1 && v$Heart_Rate > 95) || 
      v$Pulse_Pressure > 60) {
    return("Cardiology")
  }
  
  # 3. Pulmonology / Respiratory Medicine
  if (v$Sym_Breathless == 1 || 
      v$Sym_Cough == 1 || 
      v$Sym_Wheezing == 1 || 
      v$Oxygen_Saturation < 95 || 
      v$Respiratory_Rate > 22) {
    return("Pulmonology / Respiratory Medicine")
  }
  
  # 4. Endocrinology & Diabetology
  if (v$Glucose >= 140 || 
      v$Sym_High_Thirst == 1 || 
      v$Sym_Frequent_Urination == 1 || 
      v$BMI >= 30) {
    return("Endocrinology & Diabetology")
  }
  
  # 5. Neurology
  if (v$Sym_Severe_Headache == 1 || 
      v$Sym_Dizziness == 1 || 
      v$Sym_Confusion == 1 || 
      v$Sym_Blurred_Vision == 1) {
    return("Neurology")
  }
  
  # 6. Gastroenterology
  if (v$Sym_Nausea == 1 || 
      v$Sym_Abdominal_Pain == 1) {
    return("Gastroenterology")
  }
  
  # 7. Infectious Disease / Internal Medicine
  if (v$Sym_Fever == 1 || 
      v$Body_Temp >= 38.0 || 
      v$Sym_Chills == 1) {
    return("Infectious Disease / Internal Medicine")
  }
  
  # 8. General Medicine (Default outpatient baseline)
  return("General Internal Medicine")
}

#* @get /health
function() {
  list(status = "API is healthy and online")
}

#* Full Clinical Assessment & Risk Stratification Endpoint
#* @post /predict
#* @serializer json
function(req) {
  data <- jsonlite::fromJSON(req$postBody)
  
  # Extract Vitals & Metabolic Factors
  v <- list(
    Age               = as.numeric(data$Age),
    Glucose           = as.numeric(data$Glucose),
    BMI               = as.numeric(data$BMI),
    Heart_Rate        = as.numeric(data$Heart_Rate),
    Respiratory_Rate  = as.numeric(data$Respiratory_Rate),
    Body_Temp         = as.numeric(data$Body_Temp),
    Oxygen_Saturation = as.numeric(data$Oxygen_Saturation),
    Systolic_BP       = as.numeric(data$Systolic_BP),
    Diastolic_BP      = as.numeric(data$Diastolic_BP),
    
    # 14 Clinical Symptoms
    Sym_Chest_Pain          = as.numeric(data$Sym_Chest_Pain),
    Sym_Breathless          = as.numeric(data$Sym_Breathless),
    Sym_Palpitations        = as.numeric(data$Sym_Palpitations),
    Sym_High_Thirst         = as.numeric(data$Sym_High_Thirst),
    Sym_Frequent_Urination  = as.numeric(data$Sym_Frequent_Urination),
    Sym_Dizziness           = as.numeric(data$Sym_Dizziness),
    Sym_Severe_Headache     = as.numeric(data$Sym_Severe_Headache),
    Sym_Blurred_Vision      = as.numeric(data$Sym_Blurred_Vision),
    Sym_Confusion           = as.numeric(data$Sym_Confusion),
    Sym_Nausea              = as.numeric(data$Sym_Nausea),
    Sym_Abdominal_Pain      = as.numeric(data$Sym_Abdominal_Pain),
    Sym_Fatigue             = as.numeric(data$Sym_Fatigue),
    Sym_Cough               = as.numeric(data$Sym_Cough),
    Sym_Wheezing            = as.numeric(data$Sym_Wheezing),
    Sym_Fever               = as.numeric(data$Sym_Fever),
    Sym_Chills              = as.numeric(data$Sym_Chills),
    Sym_Sweating            = as.numeric(data$Sym_Sweating)
  )
  
  # Calculate Hemodynamic Parameters
  v$Pulse_Pressure <- v$Systolic_BP - v$Diastolic_BP
  v$MAP            <- v$Diastolic_BP + (v$Pulse_Pressure / 3)
  
  # Clinical Severity Scoring (Weighted MEWS + Biomarker Risks)
  score <- 0
  
  # Vitals scoring
  if (v$Oxygen_Saturation < 90) score <- score + 4 else if (v$Oxygen_Saturation < 94) score <- score + 2
  if (v$Heart_Rate > 120 || v$Heart_Rate < 50) score <- score + 2 else if (v$Heart_Rate > 100 || v$Heart_Rate < 55) score <- score + 1
  if (v$Respiratory_Rate > 24 || v$Respiratory_Rate < 9) score <- score + 3 else if (v$Respiratory_Rate > 20 || v$Respiratory_Rate < 12) score <- score + 1
  if (v$Systolic_BP >= 160 || v$Systolic_BP < 90) score <- score + 3 else if (v$Systolic_BP >= 140 || v$Systolic_BP < 100) score <- score + 1
  if (v$Body_Temp >= 38.5 || v$Body_Temp < 35.0) score <- score + 2 else if (v$Body_Temp >= 37.8 || v$Body_Temp < 36.0) score <- score + 1
  if (v$Glucose >= 200) score <- score + 3 else if (v$Glucose >= 140) score <- score + 1
  if (v$BMI >= 35) score <- score + 1
  
  # Red-flag symptoms
  if (v$Sym_Chest_Pain == 1) score <- score + 4
  if (v$Sym_Confusion == 1) score <- score + 4
  if (v$Sym_Breathless == 1) score <- score + 3
  
  # Moderate symptom penalties
  if (v$Sym_Palpitations == 1) score <- score + 2
  if (v$Sym_Wheezing == 1) score <- score + 2
  if (v$Sym_Severe_Headache == 1) score <- score + 2
  if (v$Sym_Blurred_Vision == 1) score <- score + 2
  if (v$Sym_Abdominal_Pain == 1) score <- score + 2
  if (v$Sym_High_Thirst == 1 || v$Sym_Frequent_Urination == 1) score <- score + 2
  
  # Mild symptom penalties
  if (v$Sym_Dizziness == 1) score <- score + 1
  if (v$Sym_Nausea == 1) score <- score + 1
  if (v$Sym_Fatigue == 1) score <- score + 1
  if (v$Sym_Cough == 1) score <- score + 1
  if (v$Sym_Fever == 1 || v$Sym_Chills == 1) score <- score + 1
  if (v$Sym_Sweating == 1) score <- score + 1
  
  # Stratify Risk Category
  risk <- if (score <= 3) "Low" else if (score <= 7) "Medium" else "High"
  dept <- recommend_department(v, risk)
  
  list(
    status = "success",
    predicted_risk_level = risk,
    severity_score = score,
    recommended_department = dept,
    clinical_metrics = list(
      blood_pressure = paste0(v$Systolic_BP, "/", v$Diastolic_BP, " mmHg"),
      spo2 = paste0(v$Oxygen_Saturation, "%"),
      glucose = paste0(v$Glucose, " mg/dL"),
      map = paste0(round(v$MAP, 1), " mmHg"),
      pulse_pressure = paste0(round(v$Pulse_Pressure, 1), " mmHg")
    )
  )
}