const OpenAI = require('openai');

class LLMService {
  constructor() {
    this.openai = null;
    this.initializeClient();
  }

  initializeClient() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else if (process.env.ANTHROPIC_API_KEY) {
      console.warn('Anthropic API support not yet implemented. Please use OpenAI API key.');
    } else {
      console.warn('No LLM API key configured. Natural language queries will not work.');
    }
  }

  async convertToSQL(naturalLanguageQuery) {
    if (!this.openai) {
      throw new Error('LLM service not properly configured. Please set OPENAI_API_KEY environment variable.');
    }

    const systemPrompt = `You are a SQL expert for Base blockchain data. Convert natural language queries to SQL.

Available tables and their schemas:
- base.transactions (hash, block_number, from_address, to_address, value, gas_used, gas_price, block_timestamp)
- base.events (block_number, transaction_hash, contract_address, event_signature, decoded_params, block_timestamp)
- base.blocks (number, timestamp, hash, transaction_count, gas_used, gas_limit)
- base.transfers (block_number, transaction_hash, from_address, to_address, value, token_address, block_timestamp)

Rules:
- Only SELECT queries are allowed
- Always limit results to 1000 rows max using LIMIT clause
- Use proper WHERE clauses for performance, especially with timestamps
- For time-based queries, use block_timestamp column
- Return only the SQL query, no explanation or formatting
- Use standard SQL syntax compatible with PostgreSQL
- Always include relevant columns in SELECT clause
- Use appropriate aggregation functions (COUNT, SUM, AVG) when needed`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: naturalLanguageQuery }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const sqlQuery = response.choices[0].message.content.trim();
      
      this.validateSQL(sqlQuery);
      
      return sqlQuery;
    } catch (error) {
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      throw new Error(`LLM service error: ${error.message}`);
    }
  }

  validateSQL(sqlQuery) {
    const upperQuery = sqlQuery.toUpperCase();
    
    if (!upperQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    const forbiddenKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 'TRUNCATE'];
    for (const keyword of forbiddenKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Forbidden SQL keyword detected: ${keyword}`);
      }
    }
    
    if (!upperQuery.includes('LIMIT')) {
      throw new Error('All queries must include a LIMIT clause');
    }
  }
}

module.exports = LLMService;