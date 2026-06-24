//src/utils/getGoogleAuth.js
import dotenv from 'dotenv'
dotenv.config()
import { google } from 'googleapis'

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
)

//access scopes
export const scope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
]
