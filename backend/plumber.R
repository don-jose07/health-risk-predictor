library(plumber)

#* Enable CORS
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

# Helper: Impute missing or NIL vitals with median adult baselines
safe_num <- function(val, default_val) {
  if (is.null(val) || is.na(val) || val == "" || val == "NIL") {
    return(default_val)
  }
  num <- suppressWarnings(as.numeric(val))
  if (is.na(num)) return(default_val)
  return(num)
}

# Department recommendation based on vitals + dynamic symptoms array
recommend_department <- function(v, symptoms, risk) {
  has_sym <- function(keys) any(keys %in% symptoms)

  # 1. Immediate Emergency Department (ER)
  if (risk == "High" && (
    v$Oxygen_Saturation < 90 || 
    v$Systolic_BP >= 180 || 
    v$Systolic_BP < 85 ||
    v$Heart_Rate > 135 ||
    v$Heart_Rate < 45 ||
    has_sym(c("chest_pain", "loss_of_consciousness", "seizures", "severe_dyspnea", "cyanosis"))
  )) {
    return("Emergency Care (ER / Resuscitation)")
  }

  # 2. Cardiology
  if (has_sym(c("chest_pain", "palpitations", "left_arm_pain", "edema_legs", "irregular_heartbeat")) ||
      v$Systolic_BP >= 140 || (has_sym(c("cold_sweats")) && v$Heart_Rate > 95)) {
    return("Cardiology")
  }

  # 3. Pulmonology / Respiratory
  if (has_sym(c("shortness_of_breath", "persistent_cough", "wheezing", "hemoptysis", "sore_throat")) ||
      v$Oxygen_Saturation < 95 || v$Respiratory_Rate > 22) {
    return("Pulmonology / Respiratory Medicine")
  }

  # 4. Endocrinology & Diabetology
  if (has_sym(c("excessive_thirst", "frequent_urination", "unexplained_weight_loss", "sweet_breath")) ||
      v$Glucose >= 140 || v$BMI >= 30) {
    return("Endocrinology & Diabetology")
  }

  # 5. Neurology
  if (has_sym(c("severe_headache", "dizziness_vertigo", "blurred_vision", "confusion_altered_mental", 
                "numbness_tingling", "tremors", "speech_difficulty"))) {
    return("Neurology")
  }

  # 6. Gastroenterology
  if (has_sym(c("nausea_vomiting", "severe_abdominal_pain", "diarrhea", "jaundice", "loss_of_appetite", "acid_reflux"))) {
    return("Gastroenterology")
  }

  # 7. Infectious Disease
  if (has_sym(c("high_fever", "chills_rigors", "night_sweats", "muscle_joint_aches")) || v$Body_Temp >= 38.0) {
    return("Infectious Disease / Internal Medicine")
  }

  # 8. General Outpatient Medicine
  return("General Internal Medicine")
}

#* @get /health
function() {
  list(status = "API is healthy and online")
}

#* @post /predict
#* @serializer json
function(req) {
  data <- jsonlite::fromJSON(req$postBody)
  
  # Impute any unknown / NIL vitals using clinical baselines
  v <- list(
    Heart_Rate        = safe_num(data$Heart_Rate, 75),
    Oxygen_Saturation = safe_num(data$Oxygen_Saturation, 98),
    Systolic_BP       = safe_num(data$Systolic_BP, 120),
    Diastolic_BP      = safe_num(data$Diastolic_BP, 80),
    Respiratory_Rate  = safe_num(data$Respiratory_Rate, 16),
    Body_Temp         = safe_num(data$Body_Temp, 36.8),
    Age               = safe_num(data$Age, 40),
    Glucose           = safe_num(data$Glucose, 100),
    BMI               = safe_num(data$BMI, 24.5)
  )
  
  symptoms <- if (is.null(data$Symptoms)) character(0) else as.character(data$Symptoms)
  has_sym <- function(keys) any(keys %in% symptoms)

  # Derived hemodynamics
  v$Pulse_Pressure <- v$Systolic_BP - v$Diastolic_BP
  v$MAP            <- v$Diastolic_BP + (v$Pulse_Pressure / 3)

  # Weighted clinical score
  score <- 0
  
  # Vitals risk additions
  if (v$Oxygen_Saturation < 90) score <- score + 4 else if (v$Oxygen_Saturation < 94) score <- score + 2
  if (v$Heart_Rate > 125 || v$Heart_Rate < 48) score <- score + 2 else if (v$Heart_Rate > 100 || v$Heart_Rate < 55) score <- score + 1
  if (v$Respiratory_Rate > 24 || v$Respiratory_Rate < 9) score <- score + 3 else if (v$Respiratory_Rate > 20 || v$Respiratory_Rate < 12) score <- score + 1
  if (v$Systolic_BP >= 165 || v$Systolic_BP < 90) score <- score + 3 else if (v$Systolic_BP >= 140 || v$Systolic_BP < 95) score <- score + 1
  if (v$Body_Temp >= 38.5 || v$Body_Temp < 35.0) score <- score + 2 else if (v$Body_Temp >= 37.8 || v$Body_Temp < 36.0) score <- score + 1
  if (v$Glucose >= 200) score <- score + 3 else if (v$Glucose >= 140) score <- score + 1
  if (v$BMI >= 35) score <- score + 1

  # Red-flag symptoms (critical weight)
  if (has_sym(c("chest_pain", "severe_dyspnea", "loss_of_consciousness", "seizures", "cyanosis", "speech_difficulty"))) {
    score <- score + 5
  }

  # Moderate systemic symptoms
  mod_syms <- c("palpitations", "wheezing", "severe_headache", "blurred_vision", "confusion_altered_mental",
                "severe_abdominal_pain", "excessive_thirst", "frequent_urination", "left_arm_pain", "edema_legs", "jaundice")
  score <- score + (sum(mod_syms %in% symptoms) * 2)

  # Mild outpatient symptoms
  mild_syms <- c("dizziness_vertigo", "nausea_vomiting", "high_fever", "chills_rigors", "profound_fatigue",
                 "cold_sweats", "persistent_cough", "sore_throat", "diarrhea", "muscle_joint_aches", "loss_of_appetite")
  score <- score + (sum(mild_syms %in% symptoms) * 1)

  # Final risk categorization
  risk <- if (score <= 3) "Low" else if (score <= 7) "Medium" else "High"
  dept <- recommend_department(v, symptoms, risk)

  list(
    status = "success",
    predicted_risk_level = risk,
    severity_score = score,
    recommended_department = dept,
    imputed_vitals = list(
      heart_rate = v$Heart_Rate,
      spo2 = paste0(v$Oxygen_Saturation, "%"),
      bp = paste0(v$Systolic_BP, "/", v$Diastolic_BP, " mmHg"),
      glucose = paste0(v$Glucose, " mg/dL"),
      map = paste0(round(v$MAP, 1), " mmHg")
    ),
    symptoms_evaluated_count = length(symptoms)
  )
}