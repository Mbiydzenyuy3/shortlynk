import Joi from "joi";

const shortenUrlSchema = Joi.object({
  longUrl: Joi.string().uri().max(2048).required().messages({
    "string.base": "The longUrl must be a string.",
    "string.uri": "The longUrl must be a valid URI.",
    "string.max": "The longUrl must be 2048 characters or fewer.",
    "any.required": "The longUrl field is required.",
  }),
  customCode: Joi.string().alphanum().min(4).max(10).optional().messages({
    "string.base": "The customCode must be a string.",
  }),
  expireAt: Joi.date().iso().optional(),
});

export default shortenUrlSchema;
