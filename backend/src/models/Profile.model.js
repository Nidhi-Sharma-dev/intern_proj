const { pool } = require('../config/database');

class Profile {
  /**
   * Create or Update (Upsert) user profile
   */
  static async upsert(userId, profileData) {
    const { fullName, ageGroup, gender, occupation, location, phone, dateOfBirth } = profileData;
    
    const query = `
      INSERT INTO user_profiles (user_id, full_name, age_group, gender, occupation, location, phone, date_of_birth)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        age_group = EXCLUDED.age_group,
        gender = EXCLUDED.gender,
        occupation = EXCLUDED.occupation,
        location = EXCLUDED.location,
        phone = EXCLUDED.phone,
        date_of_birth = EXCLUDED.date_of_birth,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [userId, fullName, ageGroup, gender, occupation, location, phone, dateOfBirth];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find profile by user ID
   */
  static async findByUserId(userId) {
    const query = `SELECT * FROM user_profiles WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }
}

module.exports = Profile;