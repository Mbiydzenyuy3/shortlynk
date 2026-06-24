//validator/auth-validator.js
import Joi from "joi";

// Registration schema
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.min": "Name should have at least 3 characters",
    "string.max": "Name should have at most 30 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(6)
    .max(30)
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be alphanumeric and between 6 and 30 characters",
      "string.min": "Password should have at least 6 characters",
      "string.max": "Password should have at most 30 characters",
      "any.required": "Password is required",
    }),
});

// Login schema
export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    "any.required": "username is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});
