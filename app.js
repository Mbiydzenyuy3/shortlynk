import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import morgan from 'morgan'
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'
import helmet from 'helmet'

import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swaggerConfig.js'
import errorHandler from './src/middlewares/errorHandler-middleware.js'

import indexRouter from './src/routes/index.js'
import authRouter from './src/routes/user.js'
import urlRouter from './src/routes/url.js'
import redirectRouter from './src/routes/redirect.js'

const app = express()

app.set('trust proxy', true)

// Setup __dirname (since ES modules don't have it by default)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, //limit each IP to 100 requests per `window` (here, per 15minutes)
  standardHeaders: 'draft-8', // draft-6: `Ratelimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// apply the rate limiting middleware to all requests.
app.use(limiter)

// Middleware
app.use(helmet())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.disable('x-powered-by')

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

//API Routes
app.use('/', indexRouter)
app.use('/api/oauth', authRouter)
app.use('/api/shorten', urlRouter)
app.use('/api/s', redirectRouter)

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//error message if anything goes wrong
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

export default app
