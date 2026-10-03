FROM rocker/r-ver:4.3.2

# Install Linux system dependencies needed for Plumber
RUN apt-get update -qq && apt-get install -y \
    libssl-dev \
    libcurl4-gnutls-dev \
    libxml2-dev \
    libsodium-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Plumber and JSON parser
RUN R -e "install.packages(c('plumber', 'jsonlite'))"

# Set working directory inside container
WORKDIR /app

# Copy API script
COPY backend/plumber.R /app/backend/plumber.R

# Expose default HTTP port
EXPOSE 8000

# Run API on start
CMD ["R", "-e", "pr <- plumber::plumb('/app/backend/plumber.R'); pr$run(host='0.0.0.0', port=as.numeric(Sys.getenv('PORT', 8000)))"]