import * as AuthService from '../services/user.service.js'
import { logDebug, logError, logInfo } from '../utils/logger.js'
import { generateOAuthState, verifyOAuthState } from '../utils/oauthState.js'
import { oauth2Client, scope } from '../utils/getGoogleAuth.js'
import { pool } from '../config/db.js'
import jwt from 'jsonwebtoken'
import { google } from 'googleapis'

// Register Controller
export async function register(req, res, next) {
  const { username, email, password } = req.body

  try {
    const result = await AuthService.registerUser({
      username,
      email,
      password,
    })
    res.status(201).json(result)
  } catch (err) {
    logError('❌ Error during registration:', err.message)
    next(err) // Error middleware handles it
  }
}

// Login Controller
export async function login(req, res, next) {
  const { email, password } = req.body

  try {
    const result = await AuthService.loginUser({ email, password })
    logInfo('✅ User logged in:', result.data.email)
    res.status(200).json(result)
  } catch (err) {
    logError('❌ Error logging in user:', err.message)
    next(err)
  }
}

// Logout Controller (informational)
export function logoutUser(req, res) {
  const userId = req.user?.id || 'Unknown'
  logInfo(`Logout requested for user ID: ${userId}`)
  res.json({ message: 'Logout successful. Please discard your token.' })
}

//Redirect user to Google's OAuth 2.0 server
export const googleAuthRedirect = (req, res) => {
  const state = generateOAuthState()

  //Generate a url that asks permissions
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope,
    response_type: 'code',
    //Enable incremental authorization.
    include_granted_scopes: true,
    //include the state parameter to reduce of Cross-Site Request Forgery attacks
    state,
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  })

  res.redirect(authUrl)
}

// Handle Google's OAuth callback
export const googleAuthCallback = async (req, res) => {
  const { code, state } = req.query

  // Step 1: Validate state
  const validState = verifyOAuthState(state)
  if (!validState) {
    logDebug('Invalid or expired state token')
    return res.status(400).send('Invalid OAuth state.')
  }

  if (!code) {
    logDebug('Missing auth code from Google')
    return res.status(400).send('Missing authorization code.')
  }

  try {
    // Step 2: Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Step 3: Fetch user info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Step 4: Check or create user
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [userInfo.email]
    )

    let userId
    if (existingUser.rowCount === 0) {
      const result = await pool.query(
        'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
        [userInfo.email, userInfo.name, null]
      )
      userId = result.rows[0].id
    } else {
      userId = existingUser.rows[0].id
    }

    // Step 5: Generate JWT
    const jwtPayload = {
      sub: userId,
      email: userInfo.email,
      name: userInfo.name,
    }

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '5h',
    })

    logInfo('✅ Google OAuth successful for:', userInfo.email)

    // Step 6: Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${jwtToken}`
    return res.redirect(redirectUrl)
  } catch (error) {
    logError('OAuth callback error:', error)
    res.status(500).send('OAuth callback failed.')
  }
}
