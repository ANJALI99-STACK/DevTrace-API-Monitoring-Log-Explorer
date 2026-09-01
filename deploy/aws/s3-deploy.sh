#!/usr/bin/env bash
# Builds the React frontend and syncs it to an S3 bucket configured for
# static website hosting. Run from the repo root.
#
# Prerequisites:
#   aws configure   (or an IAM role attached to the machine you run this on)
#   S3 bucket created with static website hosting enabled, e.g.:
#     aws s3 mb s3://devtrace-frontend --region ap-south-1
#     aws s3 website s3://devtrace-frontend --index-document index.html --error-document index.html
set -euo pipefail

BUCKET_NAME="${S3_FRONTEND_BUCKET:-devtrace-frontend}"
REGION="${AWS_REGION:-ap-south-1}"

echo "==> Building frontend"
cd frontend
npm ci
npm run build

echo "==> Syncing dist/ to s3://$BUCKET_NAME"
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --region "$REGION"

echo "==> Setting cache headers on static assets"
aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
  --recursive --exclude "index.html" \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable" \
  --region "$REGION"

aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
  --cache-control "no-cache" \
  --region "$REGION"

echo "==> Done. Site URL: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo "    (Put a CloudFront distribution in front of this for HTTPS + a custom domain.)"
