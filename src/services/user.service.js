import {
  findByEmail,
  createUserRecord,
  comparePassword,
} from '../models/user-model.js'
import jwt from 'jsonwebtoken'

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

// Register User
export async function registerUser({ username, email, password }) {
  try {
    const existing = await findByEmail(email)
    if (existing) {
      throw new Error('Email already in use.')
    }

    const user = await createUserRecord({ username, email, password })

    return {
      success: true,
      message: 'User registered successfully.',
      data: user,
    }
  } catch (err) {
    throw new Error(`Registration failed: ${err.message}`)
  }
}

// Login User
export async function loginUser({ email, password }) {
  try {
    const user = await findByEmail(email)
    if (!user) {
      throw new Error('User not found.')
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      throw new Error('Invalid email or password.')
    }

    const token = generateToken(user)

    return {
      success: true,
      message: 'User logged in successfully.',
      token,
      data: { id: user.id, email: user.email, username: user.username },
    }
  } catch (err) {
    throw new Error(`Login failed: ${err.message}`)
  }
}
