#!/bin/bash

# Natural Language Blockchain Query API - Comprehensive Test Suite
# Usage: ./test-endpoints.sh [BASE_URL]
# Example: ./test-endpoints.sh http://localhost:3000

BASE_URL=${1:-http://localhost:3000}
echo "🧪 Testing Blockchain Query API at: $BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    echo -e "\n${BLUE}🔍 Test: $1${NC}"
    echo "Command: $2"
    echo "Response:"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Basic Health Check
print_test "Health Check" "GET /api/health"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "$BASE_URL/api/health" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 2. Root Endpoint Info
print_test "API Info" "GET /"
curl -s -w "\nStatus: %{http_code}\n" \
  "$BASE_URL/" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 3. Examples Endpoint
print_test "Examples" "GET /api/examples"
curl -s -w "\nStatus: %{http_code}\n" \
  "$BASE_URL/api/examples" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 4. Invalid Endpoint (404 Test)
print_test "404 Test" "GET /invalid"
curl -s -w "\nStatus: %{http_code}\n" \
  "$BASE_URL/invalid" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

echo -e "\n${YELLOW}=================================================="
echo "🔐 PAYMENT-PROTECTED QUERY TESTS"
echo -e "=================================================${NC}"

# 5. Query without body (400 Test)
print_test "Empty Query Test" "POST /api/query (no body)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 6. Query with invalid JSON (400 Test)
print_test "Invalid JSON Test" "POST /api/query (invalid JSON)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":}' \
  "$BASE_URL/api/query" 2>/dev/null || echo "Invalid JSON sent"

# 7. Query with missing query field (400 Test)
print_test "Missing Query Field" "POST /api/query (empty object)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 8. Query with non-string query (400 Test)
print_test "Non-String Query" "POST /api/query (number as query)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": 123}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 9. Query too long (400 Test)
print_test "Long Query Test" "POST /api/query (>1000 chars)"
LONG_QUERY=$(printf 'a%.0s' {1..1001})
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$LONG_QUERY\"}" \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

echo -e "\n${BLUE}=================================================="
echo "💰 x402 PAYMENT FLOW TESTS"
echo -e "=================================================${NC}"

# 10. Simple Natural Language Query (Should return 402 Payment Required)
print_test "Simple Count Query" "POST /api/query (natural language)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "How many transactions happened today?"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 11. Complex Analytics Query
print_test "Analytics Query" "POST /api/query (complex)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me the top 10 largest USDC transfers in the last 24 hours"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 12. Address-specific Query
print_test "Address Query" "POST /api/query (address-specific)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "How many transactions did address 0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45 make this week?"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 13. Gas Analysis Query
print_test "Gas Analysis" "POST /api/query (gas analysis)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the average gas used per transaction in the last 1000 blocks?"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 14. Time-based Query
print_test "Time-based Query" "POST /api/query (time-based)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "How many unique addresses made transactions in the last hour?"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 15. Token Transfer Query
print_test "Token Transfer Query" "POST /api/query (token transfers)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all USDC transfers over $1000 today"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

echo -e "\n${YELLOW}=================================================="
echo "🔒 SECURITY TESTS"
echo -e "=================================================${NC}"

# 16. SQL Injection Attempt
print_test "SQL Injection Test" "POST /api/query (injection attempt)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me transactions; DROP TABLE users; --"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# 17. Malicious Query Attempt
print_test "Malicious Query Test" "POST /api/query (malicious)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "DELETE FROM base.transactions WHERE 1=1"}' \
  "$BASE_URL/api/query" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

echo -e "\n${BLUE}=================================================="
echo "⚡ PERFORMANCE TESTS"
echo -e "=================================================${NC}"

# 18. Concurrent Requests Test
print_test "Concurrent Requests" "Multiple simultaneous requests"
echo "Sending 5 concurrent requests..."
for i in {1..5}; do
  curl -s -w "Request $i Status: %{http_code} Time: %{time_total}s\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "How many blocks were mined today?"}' \
    "$BASE_URL/api/query" > /dev/null &
done
wait
echo "All concurrent requests completed"

# 19. Large Response Test
print_test "Large Response Test" "POST /api/query (potentially large result)"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me the last 100 transactions with all details"}' \
  "$BASE_URL/api/query" | head -20

echo -e "\n${GREEN}=================================================="
echo "✅ TEST SUITE COMPLETED"
echo -e "=================================================${NC}"

echo -e "\n${YELLOW}📋 EXPECTED RESULTS:${NC}"
echo "• Health check: Should show service status (200)"
echo "• Examples: Should return sample queries (200)"
echo "• Invalid endpoints: Should return 404"
echo "• Invalid requests: Should return 400 with error details"
echo "• Valid queries: Should return 402 Payment Required (if x402 configured)"
echo "• Security tests: Should reject malicious queries (400)"

echo -e "\n${BLUE}💡 NEXT STEPS:${NC}"
echo "1. If you see 402 responses, x402 payment system is working"
echo "2. If you see 503 errors, check your API key configuration"
echo "3. Use the payment flow to complete actual queries"
echo "4. Monitor the server logs for detailed error information"

echo -e "\n${YELLOW}🔧 TROUBLESHOOTING:${NC}"
echo "• 503 errors: Missing API keys (CDP, OpenAI, x402 wallet)"
echo "• 500 errors: Check server logs for configuration issues"
echo "• Connection refused: Ensure server is running on correct port"