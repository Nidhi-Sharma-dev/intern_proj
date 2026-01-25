const { pool } = require('../config/database');

class Assessment {
  static async create({ userId, type, responses, totalScore, severity }) {
    const query = `
      INSERT INTO assessments (user_id, assessment_type, responses, total_score, severity_level)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      RETURNING *
    `;
    const values = [userId, type, JSON.stringify(responses), totalScore, severity];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findLatestByUserId(userId, type) {
    const query = `
      SELECT * FROM assessments 
      WHERE user_id = $1 AND assessment_type = $2 
      ORDER BY assessed_at DESC LIMIT 1
    `;
    const result = await pool.query(query, [userId, type]);
    return result.rows[0] || null;
  }
}

module.exports = Assessment;