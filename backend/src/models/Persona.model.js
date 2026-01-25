const { pool } = require('../config/database');

class Persona {
  /**
   * Save or update agents for a specific pillar/category
   */
  static async upsert(userId, category, agents) {
    const query = `
      INSERT INTO personas (user_id, category, agents)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (user_id, category) 
      DO UPDATE SET 
        agents = EXCLUDED.agents,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [userId, category, JSON.stringify(agents)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all pillars/personas for a specific user
   */
  static async findByUserId(userId) {
    const query = `SELECT * FROM personas WHERE user_id = $1 ORDER BY category ASC`;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Persona;