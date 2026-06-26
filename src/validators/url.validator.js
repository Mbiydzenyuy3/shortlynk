import Joi from "joi";

const shortenUrlSchema = Joi.object({
  longUrl: Joi.string().uri().max(2048).required().messages({
    "string.base": "The longUrl must be a string.",
    "string.uri": "The provided long URL is malformed or invalid. Please check and try again.",
    "string.max": "The longUrl must be 2048 characters or fewer.",
    "any.required": "The longUrl field is required.",
  }),
  shortCode: Joi.string()
    .min(4)
    .max(30)
    .pattern(/^[a-zA-Z0-9-_]+$/)
    .optional()
    .messages({
      "string.base": "The shortCode must be a string.",
      "string.min": "Custom alias must be at least 4 characters long.",
      "string.max": "Custom alias cannot exceed 30 characters.",
      "string.pattern.base": "Custom alias can only contain letters, numbers, hyphens (-), and underscores (_)."
    }),
  expiresAt: Joi.date().iso().optional(),
});

// Schema for PATCH /:shortCode — only expireAt is accepted (longUrl not required)
export const updateUrlSchema = Joi.object({
  expireAt: Joi.date().iso().allow(null).optional(),
});

export default shortenUrlSchema;
