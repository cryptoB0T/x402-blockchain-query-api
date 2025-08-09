#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Natural Language Blockchain Query API Setup');
console.log('======================================================');

const checks = [];

function addCheck(name, status, message) {
  checks.push({ name, status, message });
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

try {
  require('dotenv').config();
} catch (error) {
  addCheck('dotenv', false, 'dotenv package not found');
}

addCheck('Project Structure', 
  fs.existsSync('src/server.js') && 
  fs.existsSync('src/routes/query.js') && 
  fs.existsSync('src/services/llm.js') && 
  fs.existsSync('src/services/cdp-sql.js') && 
  fs.existsSync('src/middleware/x402.js'),
  'All required files exist'
);

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'express', '@coinbase/x402', '@coinbase/coinbase-sdk', 
  'openai', 'axios', 'dotenv', 'cors'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
addCheck('Dependencies', 
  missingDeps.length === 0,
  missingDeps.length === 0 ? 'All required dependencies installed' : `Missing: ${missingDeps.join(', ')}`
);

const envExists = fs.existsSync('.env.local') || fs.existsSync('.env');
addCheck('Environment File', envExists, envExists ? 'Environment file found' : 'No .env or .env.local file found');

if (envExists) {
  const cdpKeyName = process.env.CDP_API_KEY_NAME;
  const cdpPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const x402WalletId = process.env.X402_WALLET_ID;
  const network = process.env.NETWORK;

  addCheck('CDP API Key Name', 
    !!cdpKeyName && cdpKeyName !== 'your_api_key_name',
    cdpKeyName ? 'Configured' : 'Not configured'
  );

  addCheck('CDP Private Key', 
    !!cdpPrivateKey && cdpPrivateKey !== 'your_private_key',
    cdpPrivateKey ? 'Configured' : 'Not configured'
  );

  addCheck('OpenAI API Key', 
    !!openaiKey && openaiKey !== 'your_openai_key',
    openaiKey ? 'Configured' : 'Not configured'
  );

  addCheck('x402 Wallet ID', 
    !!x402WalletId && x402WalletId !== 'your_server_wallet_id',
    x402WalletId ? 'Configured' : 'Not configured'
  );

  addCheck('Network Configuration', 
    !!network && (network === 'base-mainnet' || network === 'base-sepolia'),
    network || 'Not configured'
  );
}

console.log('\n📊 Setup Summary');
console.log('================');
const passed = checks.filter(c => c.status).length;
const total = checks.length;
console.log(`${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n🎉 Setup looks good! You can now start the server with:');
  console.log('   npm run dev');
  console.log('\n💡 Test the API with:');
  console.log('   ./test-endpoints.sh');
} else {
  console.log('\n⚠️  Please fix the issues above before starting the server.');
  console.log('\n📖 Setup instructions:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Fill in your API keys and configuration');
  console.log('   3. Run this script again to verify');
}

console.log('\n🔗 Useful Links:');
console.log('   CDP Portal: https://portal.cdp.coinbase.com');
console.log('   OpenAI Platform: https://platform.openai.com');
console.log('   Base Network: https://base.org');

process.exit(passed === total ? 0 : 1);