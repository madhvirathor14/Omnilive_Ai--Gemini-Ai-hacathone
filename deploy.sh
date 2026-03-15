#!/bin/bash
# =====================================================
# OmniLive AI — Google Cloud Run Deployment Script
# =====================================================
# Prerequisites: gcloud CLI installed and authenticated
# Usage: ./scripts/deploy.sh

set -e

# ---- CONFIGURATION (edit these) ----
PROJECT_ID="your-google-cloud-project-id"
REGION="us-central1"
SERVICE_NAME="omnilive-ai-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
# ------------------------------------

echo "🚀 Deploying OmniLive AI Backend to Cloud Run..."

# 1. Set project
gcloud config set project $PROJECT_ID

# 2. Build and push Docker image
cd backend
echo "📦 Building Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# 3. Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --timeout 3600

# 4. Get the deployed URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed --region $REGION \
  --format "value(status.url)")

echo ""
echo "✅ Backend deployed at: $BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "  1. Update frontend/.env.local:"
echo "     VITE_BACKEND_URL=$BACKEND_URL"
echo "  2. Build frontend: cd frontend && npm run build"
echo "  3. Deploy frontend to Firebase Hosting:"
echo "     firebase deploy --only hosting"
echo ""
