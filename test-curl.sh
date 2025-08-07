#!/bin/bash

echo "Registering user..."
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"superuser","password":"Root"}'
echo -e "\n"

echo "Logging in user..."
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superuser","password":"Root"}'
echo -e "\n"

echo "Inserting user document..."
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superuser",
    "user": {
      "name": "Cloud",
      "email": "cloud@seed.com",
      "age": 25
    }
  }'
echo -e "\n"

echo "Getting all users..."
curl -X GET http://localhost:3000/users
echo -e "\n"

echo "Searching user by name (regex: 'clo', case-insensitive)..."
curl -X POST http://localhost:3000/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "name": { "$regex": "clo", "$options": "i" } }
  }'
echo -e "\n"

echo "Searching users by age range (18 ≤ age < 30)..."
curl -X POST http://localhost:3000/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "age": { "$gte": 18, "$lt": 30 } }
  }'
echo -e "\n"

echo "Updating user's age to 26..."
curl -X PUT http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": "cloud@seed.com" },
    "update": { "age": 26 }
  }'
echo -e "\n"

echo "Deleting user with name 'Cloud'..."
curl -X DELETE http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "name": "Cloud" }
  }'
echo -e "\n"

echo "✅ All operations completed."
