# Natural Language Blockchain Query API

A pay-per-query API that converts natural language questions into SQL queries against Base blockchain data, protected by x402 micropayments.

## Features

- 🗣️ **Natural Language Processing**: Convert plain English questions to SQL queries using OpenAI GPT-4
- 💰 **x402 Micropayments**: Pay-per-query pricing with USDC on Base network
- 🔗 **Base Blockchain Data**: Query transactions, events, blocks, and transfers on Base
- 🛡️ **Security**: Input validation, SQL injection prevention, rate limiting
- 📊 **Rich Metadata**: Execution times, query IDs, caching status
- 🔍 **Health Monitoring**: Service status and connection testing

## Quick Start

### 1. Installation

```bash
git clone <your-repo>
cd blockchain-query-api
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```bash
# CDP Configuration
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-key-id
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\nYOUR_KEY\n-----END EC PRIVATE KEY-----"

# x402 Configuration
X402_WALLET_ID=your_server_wallet_id
X402_PRICE_USDC=0.01

# LLM Configuration
OPENAI_API_KEY=sk-your-openai-key

# Network (use base-sepolia for testing)
NETWORK=base-sepolia
```

### 3. Get Your API Keys

#### CDP API Key
1. Visit [CDP Portal](https://portal.cdp.coinbase.com)
2. Create a new API key
3. Download the private key file
4. Copy the key name and private key to your `.env.local`

#### Server Wallet (x402)
1. Create a server wallet using CDP SDK
2. Fund it with USDC for gas fees
3. Copy the wallet ID to your `.env.local`

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add it to your `.env.local`

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## API Usage

### Basic Query Flow

1. **First Request**: Returns 402 Payment Required
2. **Payment**: User pays with USDC via x402
3. **Second Request**: Returns query results

### Example Request

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How many transactions happened in the last 24 hours?"}'
```

### Example Response

```json
{
  "originalQuery": "How many transactions happened in the last 24 hours?",
  "generatedSQL": "SELECT COUNT(*) as transaction_count FROM base.transactions WHERE block_timestamp > NOW() - INTERVAL 24 HOUR LIMIT 1000",
  "result": [
    {"transaction_count": 1234567}
  ],
  "metadata": {
    "executionTimeMs": 145,
    "rowCount": 1,
    "cached": false,
    "queryId": "abc123",
    "totalExecutionTimeMs": 2341,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Available Endpoints

### POST /api/query
Main query endpoint with x402 payment protection.

**Request Body:**
```json
{
  "query": "Your natural language question"
}
```

### GET /api/health
Check service status and configuration.

### GET /api/examples
Get example queries and usage instructions.

### GET /
API information and available endpoints.

## Example Queries

- "How many transactions happened in the last 24 hours?"
- "Show me the top 10 largest USDC transfers today"
- "What's the average gas used per transaction in the last 1000 blocks?"
- "How many unique addresses made transactions this week?"
- "Show me all transactions from address 0x123... in the last hour"

## Available Data Tables

- **base.transactions**: Transaction data (hash, addresses, value, gas, timestamp)
- **base.events**: Smart contract events (contract, signature, params, timestamp)
- **base.blocks**: Block information (number, hash, transaction count, timestamp)
- **base.transfers**: Token transfers (addresses, value, token address, timestamp)

## Security Features

- **SQL Injection Prevention**: Only SELECT queries allowed
- **Input Validation**: Query length limits and sanitization
- **Rate Limiting**: Prevents abuse even with payments
- **Error Handling**: Secure error messages without internal details
- **Payment Protection**: x402 micropayments for access control

## Testing

### Local Testing (Base Sepolia)

1. Set `NETWORK=base-sepolia` in your `.env.local`
2. Use testnet USDC for payments
3. Set lower price: `X402_PRICE_USDC=0.001`

### Test the API

```bash
# Check health
curl http://localhost:3000/api/health

# Get examples
curl http://localhost:3000/api/examples

# Test query (will require payment)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1 as test LIMIT 1"}'
```

## Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
NETWORK=base-mainnet
X402_PRICE_USDC=0.01
PORT=3000
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

### Scaling Considerations

- Add Redis for query result caching
- Implement request queuing for high load
- Use multiple LLM providers for redundancy
- Add monitoring and alerting

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error description",
  "type": "error_type",
  "metadata": {
    "executionTimeMs": 123,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

Common error types:
- `validation_error`: Invalid input
- `sql_validation_error`: SQL security violation
- `llm_config_error`: LLM service not configured
- `cdp_config_error`: CDP service not configured
- `auth_error`: Authentication failed
- `rate_limit_error`: Too many requests

## Development

### Project Structure

```
blockchain-query-api/
├── src/
│   ├── middleware/
│   │   └── x402.js           # Payment protection
│   ├── services/
│   │   ├── llm.js            # Natural language → SQL
│   │   └── cdp-sql.js        # CDP SQL API client
│   ├── routes/
│   │   └── query.js          # API endpoints
│   └── server.js             # Express app
├── package.json
├── .env.example
└── README.md
```

### Adding New Features

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

For issues and questions:
- Check the health endpoint: `/api/health`
- Review error messages and types
- Ensure all environment variables are set
- Verify API key permissions and wallet funding

## License

ISC License - see LICENSE file for details.