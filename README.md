# 🔗 Feature-Rich URL Shortener API

A secure and robust Node.js + Express backend API for shortening URLs with full user authentication, custom short code support, expiration handling, analytics, and personal dashboard. Designed with real-world use cases in mind and documented with Swagger for easy consumption.

## 🚀 Features
- JWT-authenticated user accounts (registration & login)

- URL shortening with optional custom codes and expiration dates

- Click tracking and redirection logging

- User-specific dashboard (/api/my-urls)

- Public redirection endpoint (/api/s/:shortCode)

- Optional analytics endpoint (/api/shorten/:shortCode/stats)

- Secure route protection with JWT middleware

- Input validation with Joi

- Swagger documentation for API usage

- Minimalist frontend (optional)

- Deployment-ready (Render-compatible)

## 📁 Project Structure

/src
├── config/         # Database & app config
├── controllers/    # Request logic handlers
├── models/         # PostgreSQL table models
├── routes/         # API route definitions
├── middlewares/    # Auth, validation, error handling
├── validators/     # Joi validation schemas
├── utils/          # Helper functions (e.g., code generator)
app.js              # App entry point
swagger.config.js   # Swagger setup
.env                # Environment variables

## 🛠️ Tech Stack

- Node.js (ESM)

- Express.js

- PostgreSQL (via pg)

- JWT (Authentication)

- Joi (Input validation)

- Swagger (API Documentation)

- Morgan (Request logging)

- bcryptjs (Password hashing)

- CORS (Cross-Origin support)

## ⚙️ Getting Started

### 📦 Clone & Install
- git clone https://github.com/Mbiydzenyuy3/feature-rich-url-shortner
- cd url-shortener-api
- npm install

## 🔐 Environment Configuration
Create a .env file in the root directory:

PORT=4000
DB_USER=your_db_user
INIT_DB=true  (For Safer deployments by avoiding schema auto-runs)
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urlshortener
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
BASE_URL=http://localhost:4000

## 🚀 Start Development Server
npm run dev

## 📖 API Endpoint Summary

Resource	        Method	          Path                      Description
Auth	            POST	        /api/auth/register	          Register a new user
Auth	            POST	        /api/auth/login	              Login and receive JWT token
Shorten	          POST	        /api/shorten	                Create a short URL (auth required)
Redirect	        GET	          /api/s/:shortCode	(KT12FJ)    Redirect to long URL (public)
User URLs	        GET	          /api/shorten/my-urls          Get URLs created by current user
Stats ⚙️	         GET	         /api/s/:shortCode/stats	     (Optional) Get stats for a short URL

## 🔒 Authentication
For all protected routes, include the JWT token in the request headers:


Authorization: Bearer <your_token>
## 🧪 API Testing
- Use Insomnia, Postman, or curl to test endpoints.

- Example request to shorten a URL:

POST /api/shorten
Authorization: Bearer <token>
Content-Type: application/json

{
  "longUrl": "https://example.com",
  "expiresAt": "2025-05-20T00:00:00Z"
}

## 📘 API Documentation
Swagger UI available at:

http://localhost:4000/api-docs

## Pull request link to the frontend repo
- https://github.com/Mbiydzenyuy3/feature-rich-url-shortner/pull/2

## 🧩 Extra Features (Optional)
- Analytics Endpoint — View stats for each short URL (clicks, creation date, etc.)

- Frontend UI — Minimal React-based dashboard (optional)

- Deployment — Compatible with Render

## 🤝 Contributing
Contributions are welcome! Fork the repository, create a branch, and open a pull request.