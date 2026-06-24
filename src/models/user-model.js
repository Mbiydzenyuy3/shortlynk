import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// Create a user (called by service)
export const createUserRecord = async ({ username, email, password }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    return rows[0];
  } catch (error) {
    throw new Error(`DB Error (createUser): ${error.message}`);
  }
};

// Find user by email
export const findByEmail = async (email) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, password FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`DB Error (findByEmail): ${error.message}`);
  }
};

// Password comparison logic
export const comparePassword = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password compare error: ${error.message}`);
  }
};
