import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
export function generateState() {
  return uuidv4();
}

/**
 * Verify the code challenge with the code verifier (PKCE)
 * 
 * @param {string} codeVerifier - Original code verifier
 * @param {string} codeChallenge - Code challenge to verify
 * @returns {boolean} - Whether the code challenge is valid
 */
export function verifyCodeChallenge(codeVerifier, codeChallenge) {
  const hash = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return hash === codeChallenge;
}

/**
 * Create a response object with appropriate status and data
 */
export function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper for error responses
 */
export function errorResponse(message, status = 400) {
  return createResponse({ error: message }, status);
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return {};
  
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, value] = cookie.trim().split('=');
      return [key, decodeURIComponent(value)];
    })
  );
}

/**
 * Set a cookie on the response
 */
export function setCookie(response, name, value, options = {}) {
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    ...options,
  };
  
  const cookieString = `${name}=${encodeURIComponent(value)}; ${Object.entries(cookieOptions)
    .map(([key, value]) => {
      if (value === true) return key;
      if (value === false) return '';
      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join('; ')}`;
  
  response.headers.set('Set-Cookie', cookieString);
  return response;
}

/**
 * Clear a cookie on the response
 */
export function clearCookie(response, name) {
  response.headers.set(
    'Set-Cookie',
    `${name}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  );
  return response;
}