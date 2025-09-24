# run-mingledb.ps1
$baseUrl = "http://localhost:3000"

Write-Host "Registering user..."
Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -ContentType "application/json" `
  -Body '{"username":"superuser","password":"Root"}'
Write-Host "`n"

Write-Host "Logging in user..."
Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" `
  -Body '{"username":"superuser","password":"Root"}'
Write-Host "`n"

Write-Host "Inserting user document..."
Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -ContentType "application/json" `
  -Body '{
    "username": "superuser",
    "user": {
      "name": "Marco",
      "email": "marco@seed.com",
      "age": 25
    }
  }'
Write-Host "`n"

Write-Host "Getting all users..."
Invoke-RestMethod -Uri "$baseUrl/users" -Method Get
Write-Host "`n"

Write-Host "Searching user by name (regex: 'clo', case-insensitive)..."
Invoke-RestMethod -Uri "$baseUrl/users/search" -Method Post -ContentType "application/json" `
  -Body '{
    "query": { "name": { "$regex": "clo", "$options": "i" } }
  }'
Write-Host "`n"

Write-Host "Searching users by age range (18 ≤ age < 30)..."
Invoke-RestMethod -Uri "$baseUrl/users/search" -Method Post -ContentType "application/json" `
  -Body '{
    "query": { "age": { "$gte": 18, "$lt": 30 } }
  }'
Write-Host "`n"

Write-Host "Updating user's age to 26..."
Invoke-RestMethod -Uri "$baseUrl/users" -Method Put -ContentType "application/json" `
  -Body '{
    "filter": { "email": "marco@seed.com" },
    "update": { "age": 26 }
  }'
Write-Host "`n"

Write-Host "Deleting user with name 'Marco'..."
Invoke-RestMethod -Uri "$baseUrl/users" -Method Delete -ContentType "application/json" `
  -Body '{
    "filter": { "name": "Marco" }
  }'
Write-Host "`n"

Write-Host "✅ All operations completed."
