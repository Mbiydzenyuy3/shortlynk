//utils/password.js
import bcrypt from "bcryptjs";

// Function to hash the password
export const hashPassword = (plainPassword) => {
  return bcrypt.hash(plainPassword, 10);
};

// Function to verify the password
export const verifyPassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
