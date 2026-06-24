import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 4000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Feature-Rich URL Shortener API",
      version: "1.0.0",
      description:
        "A secure and feature-rich backend API for URL shortening with authentication, expiration, analytics, and management functionality.",
      contact: {
        name: "Developer",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string", example: "john_doe" },
            email: { type: "string", example: "johndoe@gmail.com" },
            password: { type: "string", example: "securePassword123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["username", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT token" },
          },
        },
        ShortenRequest: {
          type: "object",
          required: ["longUrl"],
          properties: {
            longUrl: { type: "string", format: "uri" },
            customCode: {type: "string", format: "uri"},
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        ShortURL: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            customCode: { type: "string", example: "abc123" },
            longurl: { type: "string", format: "uri" },
            createdAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            clicks: { type: "integer", example: 5 },
          },
        },

        ShortenResponse: {
          type: "object",
          properties: {
            shortUrl: {
              type: "string",
              example: "https://yourdomain.com/s/abc123",
            },
            shortcode: { type: "string", example: "abc123" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // Adjust to your route file locations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
export default swaggerSpec;
