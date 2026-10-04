/**
 * Centralized Gemini configuration.
 * Single source of truth for model name and API key resolution.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
