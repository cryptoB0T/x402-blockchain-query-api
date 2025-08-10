# X402 Payment Testing Guide

This guide explains how to test the x402 payment system for the Blockchain Query API.

## Overview

The API implements the [x402 payments protocol](https://github.com/coinbase/x402) which allows pay-per-request access to API endpoints. When you make a request without payment, you'll receive a `402 Payment Required` response. With the proper client setup, payments are handled automatically.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Test Client   │───▶│  Blockchain API  │───▶│  CDP/Base Data  │
│  (with wallet)  │    │  (x402 enabled)  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         └─────────────▶│  x402 Facilitator │
           (payment)    │   (Coinbase CDP)  │
                        └──────────────────┘
```

## Setup Instructions

### 1. Generate Test Wallet

Run the setup script to create a funded test wallet:

```bash
node setup-test-wallet.js
```

This will:
- Generate a new private key (or check existing one)
- Show your wallet address
- Provide funding instructions

### 2. Fund Your Wallet

You need both ETH (for gas) and USDC (for payments) on Base mainnet:

**Fund with real ETH for gas fees:**
- Send ETH to your wallet address
- Use Base mainnet network

**Fund with real USDC for payments:**
- Send USDC to your wallet address  
- Use Base mainnet network and USDC token

### 3. Set Environment Variables

```bash
export PRIVATE_KEY="0x..." # Your test wallet private key
export TEST_WALLET_ADDRESS="0x..." # Your wallet address
```

### 4. Start the API Server

```bash
npm start
```

The server will run on `http://localhost:3000` with x402 payment protection enabled.

## Testing Methods

### Method 1: Automated Test Script

Run the comprehensive test suite:

```bash
node test-client.js
```

This script will:
1. ✅ Check API health (free endpoint)
2. ❌ Test query without payment (expect 402)
3. ✅ Test query with automatic payment
4. ✅ Test examples endpoint with payment
5. 📊 Show test results summary

### Method 2: Manual Testing with curl

**Test without payment (should fail):**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the current price of ETH?"}'
```

Expected response: `402 Payment Required` with payment details.

**Check available resources:**
```bash
curl http://localhost:3000/
```

This returns a resource index showing available endpoints and their prices.

### Method 3: Agent Integration

For AI agents, use the pattern from the [dynamic_agent example](https://github.com/coinbase/x402/tree/main/examples/typescript/dynamic_agent):

```javascript
import axios from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { http, publicActions, createWalletClient } from "viem";

// Create wallet client
const wallet = createWalletClient({
  chain: base,
  transport: http(),
  account: privateKeyToAccount(process.env.PRIVATE_KEY),
}).extend(publicActions);

// Create axios with payment interceptor
const axiosWithPayment = withPaymentInterceptor(axios.create(), wallet);

// Use like normal axios - payments are automatic
const response = await axiosWithPayment.post('http://localhost:3000/api/query', {
  query: 'What is the current price of ETH on Base?'
});
```

## API Endpoints

### Resource Index: `GET /`
- **Cost**: Free
- **Description**: Returns list of available paid endpoints
- **Response**: Array of resource objects with URLs, descriptions, and prices

### Query Endpoint: `POST /api/query`
- **Cost**: $0.001 USDC
- **Description**: Convert natural language to SQL and execute against Base blockchain data
- **Body**: `{"query": "Your question here"}`
- **Response**: Query results and metadata

### Examples: `GET /api/examples`
- **Cost**: $0.0001 USDC
- **Description**: Get example queries and responses
- **Response**: Array of example queries

### Health Check: `GET /api/health`
- **Cost**: Free
- **Description**: Check API status
- **Response**: Service health information

## Configuration

### Environment Variables

**Server Configuration:**
```bash
X402_WALLET_ID=0x...           # Your server wallet address (receives payments)
X402_PRICE_USDC=0.001          # Price per query in USDC
X402_VERIFY_DISABLED=false     # Enable for production
NETWORK=base-mainnet           # Blockchain network
```

**Client Configuration:**
```bash
PRIVATE_KEY=0x...              # Client wallet private key (sends payments)
TEST_WALLET_ADDRESS=0x...      # Client wallet address
```

### Payment Flow

1. **Client Request**: Client makes HTTP request to protected endpoint
2. **402 Response**: Server responds with `402 Payment Required` and payment details
3. **Payment Creation**: Client creates payment transaction using wallet
4. **Payment Verification**: Server verifies payment with x402 facilitator
5. **Service Delivery**: Server processes request and returns response
6. **Payment Settlement**: Payment is settled on Base mainnet blockchain

## Troubleshooting

### Common Issues

**"Failed to connect to localhost port 3000"**
- Ensure the API server is running: `npm start`
- Check if port 3000 is available

**"402 Payment Required" with payment client**
- Verify wallet has USDC balance on Base mainnet
- Check private key is correctly set
- Ensure wallet has ETH for gas fees

**"Payment verification failed"**
- Check network connectivity
- Verify x402 facilitator is accessible
- Ensure correct network (base-mainnet)

**"Insufficient funds"**
- Add more USDC to your wallet on Base mainnet
- Add more ETH for gas fees on Base mainnet
- Check wallet balance: `node setup-test-wallet.js`

### Debug Mode

Enable debug logging:
```bash
DEBUG=x402:* node test-client.js
```

### Testing Without Payments

For development, you can disable payment verification:
```bash
export X402_VERIFY_DISABLED=true
npm start
```

## Security Notes

⚠️ **Important**: This uses real funds on mainnet!

- Keep private keys secure and never commit to version control
- Use environment variables for sensitive data
- Start with small amounts for testing
- Monitor your server wallet for received payments
- This will use real ETH and USDC

## Next Steps

1. **Rate Limiting**: Add rate limiting for production use
2. **Monitoring**: Set up payment and usage monitoring  
3. **Integration**: Integrate with AI agents and applications
4. **Scaling**: Consider payment batching for high-volume usage
5. **Security**: Implement additional security measures for production

## Resources

- [x402 Protocol Documentation](https://github.com/coinbase/x402)
- [Base Network Documentation](https://docs.base.org/)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
- [Viem Documentation](https://viem.sh/)
- [Base Network Documentation](https://docs.base.org/)