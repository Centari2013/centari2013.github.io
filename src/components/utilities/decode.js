// src/components/utilities/decode.js

/**
 * Extracts base64 content from a data URL.
 * @param {string} content - A data URI (e.g., data:text/plain;base64,...)
 * @returns {string|null} - Base64-encoded string or null if not matched
 */
function extractBase64Data(content) {
  const match = content.match(/^data:.*;base64,(.*)$/);
  return match ? match[1] : null;
}

/**
 * Decodes base64 content to a string.
 * @param {string} base64 - Base64-encoded string
 * @returns {string} - Decoded text
 */
function decodeBase64(base64) {
  return atob(base64);
}

/**
 * Renders base64 content as HTML-safe string with line breaks.
 * @param {string} content - Full data URI
 * @returns {string} - Decoded HTML string
 */
export function extractAndDecodeBase64(content) {
  const base64 = extractBase64Data(content);
  if (!base64) return "";
  const decoded = decodeBase64(base64);
  return decoded
}
