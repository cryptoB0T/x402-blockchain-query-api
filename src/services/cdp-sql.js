const axios = require('axios');
const { Coinbase } = require('@coinbase/coinbase-sdk');

class CDPSQLService {
  constructor() {
    this.baseURL = 'https://api.cdp.coinbase.com/platform';
    this.coinbase = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
        console.warn('CDP API credentials not configured. SQL queries will not work.');
        return;
      }

      this.coinbase = new Coinbase({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        privateKey: process.env.CDP_API_KEY_PRIVATE_KEY
      });
    } catch (error) {
      console.error('Failed to initialize CDP client:', error);
    }
  }

  async executeQuery(sqlQuery) {
    if (!this.coinbase) {
      throw new Error('CDP client not properly configured. Please set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables.');
    }

    try {
      const token = await this.coinbase.generateJWT();
      
      const response = await axios.post(
        `${this.baseURL}/v2/data/query/run`,
        { 
          sql: sqlQuery,
          format: 'json'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        result: response.data.result || response.data,
        metadata: {
          executionTimeMs: response.headers['x-execution-time'] || 'unknown',
          rowCount: Array.isArray(response.data.result) ? response.data.result.length : 0,
          cached: response.headers['x-cache-status'] === 'HIT',
          queryId: response.headers['x-query-id'] || null
        }
      };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new Error('CDP API authentication failed. Please check your API credentials.');
        } else if (status === 403) {
          throw new Error('CDP API access forbidden. Please check your API key permissions.');
        } else if (status === 429) {
          throw new Error('CDP API rate limit exceeded. Please try again later.');
        } else if (status === 400) {
          throw new Error(`Invalid SQL query: ${errorData.errorMessage || errorData.message || 'Bad request'}`);
        } else {
          throw new Error(`CDP SQL API Error (${status}): ${errorData.errorMessage || errorData.message || error.message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Query timeout. Please try a simpler query or add more specific filters.');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  async testConnection() {
    try {
      const testQuery = 'SELECT 1 as test LIMIT 1';
      const result = await this.executeQuery(testQuery);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = CDPSQLService;