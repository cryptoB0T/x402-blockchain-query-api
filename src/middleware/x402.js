const { x402Middleware } = require('@coinbase/x402');
const { Coinbase, Wallet } = require('@coinbase/coinbase-sdk');

const createX402Middleware = () => {
  const x402Config = {
    price: parseFloat(process.env.X402_PRICE_USDC) || 0.01,
    currency: 'USDC',
    network: process.env.NETWORK || 'base-mainnet',
    walletId: process.env.X402_WALLET_ID,
    description: 'Natural Language Blockchain Query - Pay per query to convert natural language to SQL and execute against Base blockchain data'
  };

  if (!x402Config.walletId) {
    console.warn('X402_WALLET_ID not configured. x402 payments will not work.');
    return (req, res, next) => {
      console.warn('Skipping x402 payment check - wallet not configured');
      next();
    };
  }

  try {
    return x402Middleware(x402Config);
  } catch (error) {
    console.error('Failed to initialize x402 middleware:', error);
    return (req, res, next) => {
      res.status(500).json({ 
        error: 'Payment system configuration error',
        type: 'x402_config_error'
      });
    };
  }
};

module.exports = createX402Middleware();