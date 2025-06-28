# SMS Bank Reader API Test Script
Write-Host "Testing SMS Bank Reader API..." -ForegroundColor Green

# Test configuration
$BASE_URL = "http://localhost:3000"
$API_KEY = "demo-key-123"

# Test Health Check
Write-Host "`nTesting Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health"
    Write-Host "Health Check Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Get Transactions
Write-Host "`nTesting Get Transactions..." -ForegroundColor Yellow
try {
    $headers = @{"X-API-Key" = $API_KEY}
    $response = Invoke-RestMethod -Uri "$BASE_URL/transactions" -Headers $headers
    Write-Host "Get Transactions Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Get Transactions Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Invalid API Key
Write-Host "`nTesting Invalid API Key..." -ForegroundColor Yellow
try {
    $headers = @{"X-API-Key" = "invalid-key"}
    $response = Invoke-RestMethod -Uri "$BASE_URL/transactions" -Headers $headers
} catch {
    Write-Host "Invalid API Key Response (Expected Error):" -ForegroundColor Green
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody -ForegroundColor Yellow
}

# Test Missing API Key
Write-Host "`nTesting Missing API Key..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/transactions"
} catch {
    Write-Host "Missing API Key Response (Expected Error):" -ForegroundColor Green
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody -ForegroundColor Yellow
}

# Test API Documentation
Write-Host "`nTesting API Documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/docs"
    Write-Host "API Documentation Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "API Documentation Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAll tests completed!" -ForegroundColor Green 