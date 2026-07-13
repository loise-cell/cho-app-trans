# Usage (in backend\worker):
#   .\set-ocr-secret.ps1 -OcrKey "YOUR_OCR_SPACE_KEY"

param(
  [Parameter(Mandatory = $true)]
  [string]$OcrKey
)

$OcrKey.Trim() | npx wrangler secret put OCR_SPACE_API_KEY
Write-Host "Done: OCR_SPACE_API_KEY saved to Cloudflare Worker."
