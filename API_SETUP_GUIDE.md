# 🚀 API Setup Guide - Required Keys & Configuration

## ✅ Mock Data Verification: CLEAN
**No mock data found** - All responses come from real APIs:
- ✅ No hardcoded results in services
- ✅ No fake data in responses  
- ✅ Only one test query: `SELECT 1 as test LIMIT 1` (for connection testing)
- ✅ All blockchain data comes from CDP SQL API
- ✅ All SQL generation comes from OpenAI GPT-4

## 🔑 Required API Keys & Setup

### 1. **Coinbase Developer Platform (CDP) API** - REQUIRED
**Purpose**: Query Base blockchain data via SQL

**Setup Steps**:
1. Visit [CDP Portal](https://portal.cdp.coinbase.com)
2. Create account and verify identity
3. Create new API key with these permissions:
   - `wallet:read`
   - `wallet:create` 
   - `data:read` (for SQL queries)
4. Download the private key JSON file
5. Extract values for `.env.local`:

```bash
# From the downloaded JSON file
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-key-id
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIFakeKeyDataHereReplaceMeWithRealKey
-----END EC PRIVATE KEY-----"
```

**Cost**: Free tier available, pay-per-query for heavy usage

### 2. **OpenAI API Key** - REQUIRED  
**Purpose**: Convert natural language to SQL queries

**Setup Steps**:
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key
4. Add to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Cost**: ~$0.03 per 1K tokens (GPT-4), approximately $0.001-0.01 per query

### 3. **x402 Server Wallet** - REQUIRED FOR PAYMENTS
**Purpose**: Receive USDC payments for API access

**Setup Steps**:
1. Create server wallet using CDP SDK:

```javascript
// Run this script once to create your wallet
const { Coinbase, Wallet } = require('@coinbase/coinbase-sdk');

const coinbase = new Coinbase({
  apiKeyName: 'your_cdp_api_key_name',
  privateKey: 'your_cdp_private_key'
});

async function createServerWallet() {
  const wallet = await Wallet.create({
    networkId: 'base-sepolia' // or 'base-mainnet' for production
  });
  
  console.log('Wallet ID:', wallet.getId());
  console.log('Default Address:', await wallet.getDefaultAddress());
  
  // Save the wallet ID to your .env.local
}

createServerWallet();
```

2. Fund the wallet with USDC for gas fees:
   - **Testnet**: Get Base Sepolia ETH from faucet + testnet USDC
   - **Mainnet**: Send real USDC to the wallet address

3. Add to `.env.local`:

```bash
X402_WALLET_ID=your-server-wallet-id-here
X402_PRICE_USDC=0.01  # Price per query in USDC
```

## 📝 Complete .env.local Template

```bash
# CDP Configuration (REQUIRED)
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-key-id
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
YourActualPrivateKeyHere
-----END EC PRIVATE KEY-----"

# x402 Configuration (REQUIRED)
X402_WALLET_ID=your-server-wallet-id
X402_PRICE_USDC=0.01

# LLM Configuration (REQUIRED - choose one)
OPENAI_API_KEY=sk-your-openai-key
# OR (not yet implemented)
# ANTHROPIC_API_KEY=your-anthropic-key

# Network Configuration
NETWORK=base-sepolia  # Use base-mainnet for production
PORT=3000
NODE_ENV=development
```

## 🧪 Testing Without Full Setup

### Option 1: Health Check Only
```bash
# Start server without API keys
npm run dev

# Test basic endpoints (will show "not_configured" status)
curl http://localhost:3000/api/health
curl http://localhost:3000/api/examples
```

### Option 2: Partial Testing
```bash
# With only OpenAI key - tests LLM conversion
OPENAI_API_KEY=sk-your-key npm run dev

# Test query conversion (will fail at CDP step)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How many transactions today?"}'
```

## 🔧 Verification Steps

### 1. Run Setup Verification
```bash
node verify-setup.js
```

### 2. Check Service Status
```bash
curl http://localhost:3000/api/health
```

Expected response when fully configured:
```json
{
  "status": "healthy",
  "services": {
    "llm": "configured",
    "cdp": "configured", 
    "cdp_connection": "connected",
    "x402": "configured"
  }
}
```

### 3. Run Comprehensive Tests
```bash
./test-endpoints.sh
```

## 💰 Cost Estimates

### Per Query Costs:
- **OpenAI GPT-4**: ~$0.001-0.01 per query
- **CDP SQL API**: Free tier, then pay-per-query
- **Base Network Gas**: ~$0.001-0.01 per transaction
- **Your Revenue**: Set via `X402_PRICE_USDC` (suggested: $0.01-0.10)

### Monthly Estimates (1000 queries):
- **OpenAI**: $1-10
- **CDP**: $0-5 (depending on usage tier)
- **Gas Fees**: $1-10
- **Revenue**: $10-100 (at $0.01-0.10 per query)

## 🚨 Security Checklist

- [ ] Never commit API keys to git
- [ ] Use `.env.local` (gitignored) for secrets
- [ ] Use testnet for development
- [ ] Monitor wallet balance for gas fees
- [ ] Set reasonable query pricing
- [ ] Enable rate limiting in production
- [ ] Monitor API usage and costs

## 🔄 Network Switching

### Development (Base Sepolia)
```bash
NETWORK=base-sepolia
X402_PRICE_USDC=0.001  # Lower price for testing
```

### Production (Base Mainnet)  
```bash
NETWORK=base-mainnet
X402_PRICE_USDC=0.01   # Real pricing
```

## 📞 Support Resources

- **CDP Documentation**: [docs.cdp.coinbase.com](https://docs.cdp.coinbase.com)
- **OpenAI API Docs**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Base Network**: [base.org](https://base.org)
- **x402 Protocol**: [github.com/coinbase/x402](https://github.com/coinbase/x402)

## 🎯 Quick Start Commands

```bash
# 1. Clone and install
git clone <repo>
cd blockchain-query-api
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start server
npm run dev

# 4. Test endpoints
./test-endpoints.sh

# 5. Check health
curl http://localhost:3000/api/health
```

**Ready to go!** 🚀