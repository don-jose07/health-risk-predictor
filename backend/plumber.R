library(plumber)

#* Enable CORS so the Vercel frontend can query this API
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

# Clinical department triage logic
recommend_department <- function(v, risk) {
  if (risk == "High" && (v$Oxygen_Saturation < 90 || v$Systolic_BP >= 180 || v$Sym_Chest_Pain == 1)) {
    return("Emergency Care (ER)")
  }
  if (v$Sym_Chest_Pain == 1 || v$Systolic_BP >= 140 || v$Heart_Rate > 105) {
    return("Cardiology")
  } else if (v$Sym_Breathless == 1 || v$Oxygen_Saturation < 95 || v$Respiratory_Rate > 22) {
    return("Pulmonology")
  } else if (v$Glucose >= 140 || v$Sym_High_Thirst == 1 || v$BMI >= 30) {
    return("Endocrinology / Diabetology")
  } else {
    return("General Medicine")
  }
}

#* Health check endpoint
#* @get /health
function() {
  list(status = "API is healthy and online")
}

#* Predict Patient Risk Level and Routing
#* @post /predict
#* @serializer json
function(req) {
  data <- jsonlite::fromJSON(req$postBody)
  
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
    Sym_Chest_Pain    = as.numeric(data$Sym_Chest_Pain),
    Sym_Breathless    = as.numeric(data$Sym_Breathless),
    Sym_High_Thirst   = as.numeric(data$Sym_High_Thirst)
  )
  
  # Calculate hemodynamic parameters
  v$Pulse_Pressure <- v$Systolic_BP - v$Diastolic_BP
  v$MAP            <- v$Diastolic_BP + (v$Pulse_Pressure / 3)
  
  # Scoring baseline derived from MLlib feature importances & clinical MEWS
  score <- (v$Oxygen_Saturation < 94) * 2 + (v$Oxygen_Saturation < 90) * 2 +
           (v$Heart_Rate > 100 || v$Heart_Rate < 55) * 1 +
           (v$Respiratory_Rate > 22 || v$Respiratory_Rate < 10) * 2 +
           (v$Systolic_BP > 140 || v$Systolic_BP < 95) * 1 +
           (v$Body_Temp > 38.0 || v$Body_Temp < 35.5) * 1 +
           (v$Glucose > 180) * 2 +
           (v$Sym_Chest_Pain * 3) + 
           (v$Sym_Breathless * 2)
  
  risk <- if (score <= 1) "Low" else if (score <= 4) "Medium" else "High"
  dept <- recommend_department(v, risk)
  
  list(
    status = "success",
    predicted_risk_level = risk,
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