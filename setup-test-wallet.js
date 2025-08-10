#!/usr/bin/env node

/**
 * Setup script to create a mainnet wallet for x402 payments
 * 
 * This script:
 * 1. Generates a new wallet or uses an existing private key
 * 2. Shows the wallet address for funding
 * 3. Provides instructions for funding with real ETH and USDC on Base mainnet
 */

const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');
const { createWalletClient, http, publicActions } = require('viem');

function generateTestWallet() {
  console.log('🔐 Generating new mainnet wallet...');
  
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  console.log('\n✅ Mainnet wallet generated!');
  console.log('========================');
  console.log(`🔑 Private Key: ${privateKey}`);
  console.log(`📍 Address: ${account.address}`);
  
  return { privateKey, address: account.address };
}

async function checkExistingWallet(privateKey) {
  try {
    const account = privateKeyToAccount(privateKey);
    const wallet = createWalletClient({
      chain: base,
      transport: http(),
      account,
    }).extend(publicActions);

    console.log('\n🔍 Checking existing wallet...');
    console.log(`📍 Address: ${account.address}`);
    
    const balance = await wallet.getBalance({ address: account.address });
    console.log(`💎 ETH Balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);
    
    return { privateKey, address: account.address, balance };
  } catch (error) {
    console.error('❌ Error checking wallet:', error.message);
    return null;
  }
}

function showFundingInstructions(address, privateKey) {
  console.log('\n💰 Funding Instructions:');
  console.log('========================');
  console.log('1. Fund with real ETH for gas fees:');
  console.log(`   📍 Send ETH to: ${address}`);
  console.log(`   💡 Use Base mainnet network`);
  console.log('');
  console.log('2. Fund with real USDC for payments:');
  console.log(`   📍 Send USDC to: ${address}`);
  console.log(`   💡 Use Base mainnet network and USDC token`);
  console.log('');
  console.log('3. Set environment variables:');
  console.log(`   export PRIVATE_KEY="${privateKey}"`);
  console.log(`   export TEST_WALLET_ADDRESS="${address}"`);
  console.log('');
  console.log('4. Run the test client:');
  console.log('   node test-client.js');
}

async function main() {
  console.log('🚀 Blockchain Query API - Mainnet Wallet Setup');
  console.log('===========================================');
  
  const existingPrivateKey = process.env.PRIVATE_KEY;
  let walletInfo;
  
  if (existingPrivateKey) {
    console.log('🔍 Found existing PRIVATE_KEY environment variable');
    walletInfo = await checkExistingWallet(existingPrivateKey);
    
    if (!walletInfo) {
      console.log('❌ Invalid private key, generating new one...');
      walletInfo = generateTestWallet();
    }
  } else {
    walletInfo = generateTestWallet();
  }
  
  showFundingInstructions(walletInfo.address, walletInfo.privateKey);
  
  console.log('\n⚠️  Important Security Notes:');
  console.log('============================');
  console.log('- This wallet will use REAL FUNDS on Base mainnet');
  console.log('- Keep your private key secure and never commit it to git');
  console.log('- Use environment variables to store sensitive data');
  console.log('- Start with small amounts for testing');
  
  console.log('\n✅ Setup complete! Fund your wallet with real ETH and USDC on Base mainnet.');
}

main().catch(console.error);