const express = require('express');
const x402Middleware = require('../middleware/x402');
const LLMService = require('../services/llm');
const CDPSQLService = require('../services/cdp-sql');

const router = express.Router();
const llmService = new LLMService();
const cdpService = new CDPSQLService();

router.post('/query', x402Middleware, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query is required and must be a string',
        type: 'validation_error'
      });
    }

    if (query.length > 1000) {
      return res.status(400).json({ 
        error: 'Query too long. Maximum 1000 characters allowed.',
        type: 'validation_error'
      });
    }

    console.log(`Processing query: "${query}"`);

    const sqlQuery = await llmService.convertToSQL(query);
    console.log(`Generated SQL: ${sqlQuery}`);
    
    const result = await cdpService.executeQuery(sqlQuery);
    
    const executionTime = Date.now() - startTime;
    
    res.json({
      originalQuery: query,
      generatedSQL: sqlQuery,
      result: result.result,
      metadata: {
        ...result.metadata,
        totalExecutionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Query execution error:', error);
    
    let statusCode = 500;
    let errorType = 'query_execution_error';
    
    if (error.message.includes('LLM service not properly configured')) {
      statusCode = 503;
      errorType = 'llm_config_error';
    } else if (error.message.includes('CDP client not properly configured')) {
      statusCode = 503;
      errorType = 'cdp_config_error';
    } else if (error.message.includes('Only SELECT queries are allowed') || 
               error.message.includes('Forbidden SQL keyword') ||
               error.message.includes('must include a LIMIT clause')) {
      statusCode = 400;
      errorType = 'sql_validation_error';
    } else if (error.message.includes('Invalid SQL query')) {
      statusCode = 400;
      errorType = 'invalid_sql_error';
    } else if (error.message.includes('authentication failed')) {
      statusCode = 401;
      errorType = 'auth_error';
    } else if (error.message.includes('rate limit exceeded')) {
      statusCode = 429;
      errorType = 'rate_limit_error';
    }
    
    res.status(statusCode).json({ 
      error: error.message,
      type: errorType,
      metadata: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      llm: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      cdp: (process.env.CDP_API_KEY_NAME && process.env.CDP_API_KEY_PRIVATE_KEY) ? 'configured' : 'not_configured',
      x402: process.env.X402_WALLET_ID ? 'configured' : 'not_configured'
    }
  };

  try {
    const cdpTest = await cdpService.testConnection();
    health.services.cdp_connection = cdpTest.success ? 'connected' : 'failed';
    if (!cdpTest.success) {
      health.services.cdp_error = cdpTest.error;
    }
  } catch (error) {
    health.services.cdp_connection = 'failed';
    health.services.cdp_error = error.message;
  }

  const allConfigured = Object.values(health.services).every(status => 
    status === 'configured' || status === 'connected'
  );
  
  if (!allConfigured) {
    health.status = 'degraded';
  }

  res.json(health);
});

router.get('/examples', (req, res) => {
  res.json({
    examples: [
      {
        query: "How many transactions happened in the last 24 hours?",
        description: "Count recent transactions"
      },
      {
        query: "Show me the top 10 largest USDC transfers today",
        description: "Find largest token transfers"
      },
      {
        query: "What's the average gas used per transaction in the last 1000 blocks?",
        description: "Calculate gas usage statistics"
      },
      {
        query: "How many unique addresses made transactions this week?",
        description: "Count active addresses"
      },
      {
        query: "Show me all transactions from address 0x123... in the last hour",
        description: "Filter transactions by address and time"
      }
    ],
    usage: {
      endpoint: "/api/query",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        query: "Your natural language question here"
      }
    }
  });
});

module.exports = router;