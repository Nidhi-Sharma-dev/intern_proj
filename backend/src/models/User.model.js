const { pool } = require('../config/database');

class User {
  /**
   * Create a new user
   */
  static async create({ email, passwordHash }) {
    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, uuid, email, is_verified, is_active, created_at
    `;
    
    const values = [email, passwordHash];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, uuid, email, password_hash, is_verified, is_active, created_at, last_login
      FROM users
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, uuid, email, is_verified, is_active, created_at, last_login
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by UUID
   */
  static async findByUUID(uuid) {
    const query = `
      SELECT id, uuid, email, is_verified, is_active, created_at, last_login
      FROM users
      WHERE uuid = $1
    `;
    
    const result = await pool.query(query, [uuid]);
    return result.rows[0] || null;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, last_login
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Check if email exists
   */
  static async emailExists(email) {
    const query = `SELECT id FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Update user verification status
   */
  static async verifyEmail(userId) {
    const query = `
      UPDATE users
      SET is_verified = TRUE
      WHERE id = $1
      RETURNING id, is_verified
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPasswordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [newPasswordHash, userId]);
    return result.rows[0];
  }

  /**
   * Deactivate user account
   */
  static async deactivate(userId) {
    const query = `
      UPDATE users
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id, is_active
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get user statistics
   */
  static async getStats(userId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM activity_logs WHERE user_id = $1) as total_activities,
        (SELECT COUNT(*) FROM assessments WHERE user_id = $1) as total_assessments,
        (SELECT COUNT(*) FROM recommendations WHERE user_id = $1 AND status = 'pending') as pending_recommendations,
        (SELECT COALESCE(SUM(points), 0) FROM rewards WHERE user_id = $1) as total_reward_points
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = User;