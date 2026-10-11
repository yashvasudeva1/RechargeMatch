param(
  [string]$Region = "ap-south-1",
  [string]$StackName = "rechargematch-stack"
)

$ErrorActionPreference = "Stop"

Write-Host "1. Verifying AWS CLI authentication..." -ForegroundColor Cyan
aws sts get-caller-identity --output table
if ($LASTEXITCODE -ne 0) {
  Write-Error "AWS CLI is not authenticated. Run 'aws configure' with your Access Key and Secret Key first."
  exit 1
}

Write-Host "2. Deploying RechargeMatch CloudFormation Stack ($StackName) in $Region..." -ForegroundColor Cyan
aws cloudformation deploy `
  --template-file "$PSScriptRoot\template.yaml" `
  --stack-name $StackName `
  --capabilities CAPABILITY_NAMED_IAM `
  --region $Region

Write-Host "3. Fetching provisioned API Gateway URL & S3 Bucket..." -ForegroundColor Cyan
$ApiUrl = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --region $Region `
  --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayInvokeUrl'].OutputValue" `
  --output text

$S3Bucket = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --region $Region `
  --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" `
  --output text

Write-Host ""
Write-Host "AWS Backend Provisioned Successfully!" -ForegroundColor Green
Write-Host "API Gateway URL : $ApiUrl"
Write-Host "S3 Bucket Name  : $S3Bucket"

# Update or create .env with the live AWS endpoints
$EnvPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (-not (Test-Path $EnvPath)) {
  Copy-Item (Join-Path (Split-Path $PSScriptRoot -Parent) ".env.example") $EnvPath
}

$EnvContent = Get-Content $EnvPath -Raw
$EnvContent = $EnvContent -replace 'VITE_AWS_REGION=".*"', "VITE_AWS_REGION=`"$Region`""
$EnvContent = $EnvContent -replace 'VITE_AWS_API_GATEWAY_URL=".*"', "VITE_AWS_API_GATEWAY_URL=`"$ApiUrl`""
$EnvContent = $EnvContent -replace 'VITE_AWS_S3_BUCKET_URL=".*"', "VITE_AWS_S3_BUCKET_URL=`"https://$S3Bucket.s3.$Region.amazonaws.com`""
Set-Content -Path $EnvPath -Value $EnvContent

Write-Host "Updated .env with live AWS endpoints." -ForegroundColor Green
