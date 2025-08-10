#!/usr/bin/env node

/**
 * Test client for the blockchain query API with x402 payments
 * 
 * This script demonstrates how to:
 * 1. Make requests to the API without payment (should get 402)
 * 2. Make requests with automatic x402 payment handling
 * 3. Test different endpoints
 */

const axios = require('axios');
const { withPaymentInterceptor } = require('x402-axios');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const { http, publicActions, createWalletClient } = require('viem');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your funded wallet private key
const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS; // Your wallet address

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable is required');
  console.log('💡 Set your private key: export PRIVATE_KEY="0x..."');
  console.log('💡 Make sure your wallet has USDC on Base Sepolia');
  console.log('💡 Get testnet USDC from: https://portal.cdp.coinbase.com/products/faucet');
  process.exit(1);
}

// Create wallet client for payments
const wallet = createWalletClient({
  chain: baseSepolia,
  transport: http(),
  account: privateKeyToAccount(PRIVATE_KEY),
}).extend(publicActions);

// Create axios instance with payment interceptor
const axiosWithPayment = withPaymentInterceptor(axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
}), wallet);

// Regular axios for testing 402 responses
const axiosRegular = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

async function testHealthEndpoint() {
  console.log('\n🔍 Testing health endpoint (should be free)...');
  try {
    const response = await axiosRegular.get('/api/health');
    console.log('✅ Health check:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testWithoutPayment() {
  console.log('\n🚫 Testing query endpoint without payment (should get 402)...');
  try {
    const response = await axiosRegular.post('/api/query', {
      query: 'What is the current price of ETH?'
    });
    console.log('❌ Unexpected success - payment should be required');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 402) {
      console.log('✅ Got 402 Payment Required as expected');
      console.log('💰 Payment details:', error.response.data);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testWithPayment() {
  console.log('\n💳 Testing query endpoint with automatic payment...');
  try {
    const response = await axiosWithPayment.post('/api/query', {
      query: 'What is the current price of ETH on Base?'
    });
    console.log('✅ Query successful with payment!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Query with payment failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testExamplesEndpoint() {
  console.log('\n📚 Testing examples endpoint with payment...');
  try {
    const response = await axiosWithPayment.get('/api/examples');
    console.log('✅ Examples retrieved with payment!');
    console.log('📋 Examples count:', response.data.examples?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Examples request failed:', error.message);
    return false;
  }
}

async function checkWalletBalance() {
  console.log('\n💰 Checking wallet balance...');
  try {
    const address = wallet.account.address;
    const balance = await wallet.getBalance({ address });
    console.log(`📍 Wallet address: ${address}`);
    console.log(`💎 ETH balance: ${balance} wei`);
    
    // Note: To check USDC balance, we'd need the USDC contract address and ABI
    // For now, just show ETH balance
    return true;
  } catch (error) {
    console.error('❌ Failed to check wallet balance:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting blockchain query API test with x402 payments');
  console.log('🌐 API URL:', API_BASE_URL);
  
  const results = {
    health: false,
    payment402: false,
    queryWithPayment: false,
    examples: false,
    walletBalance: false,
  };

  // Check wallet balance first
  results.walletBalance = await checkWalletBalance();

  // Test health endpoint (should be free)
  results.health = await testHealthEndpoint();
  
  if (!results.health) {
    console.error('❌ API is not healthy, stopping tests');
    process.exit(1);
  }

  // Test without payment (should get 402)
  results.payment402 = await testWithoutPayment();

  // Test with payment
  results.queryWithPayment = await testWithPayment();

  // Test examples endpoint
  results.examples = await testExamplesEndpoint();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  if (!allPassed) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Make sure the API server is running on port 3000');
    console.log('- Ensure your wallet has USDC on Base Sepolia');
    console.log('- Check that X402_VERIFY_DISABLED is not set to true in production');
    console.log('- Verify your private key is correct and funded');
  }

  process.exit(allPassed ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);