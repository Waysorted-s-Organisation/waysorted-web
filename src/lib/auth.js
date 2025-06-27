import jwt from 'jsonwebtoken';
import dbConnect from './db';
import User from '../models/session';
import { generateState, errorResponse } from './utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production';
const TOKEN_EXPIRY = '24h';

/**
 * Generate a JWT token for a user
 * 
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode a JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Store PKCE challenge details for a user
 * 
 * @param {string} email - User email
 * @param {string} codeVerifier - PKCE code verifier
 * @returns {string} - State parameter for OAuth
 */
export async function storePkceChallenge(email, codeVerifier) {
  await dbConnect();
  
  const state = generateState();
  
  // Find or create the user
  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        pendingCodeVerifier: codeVerifier,
        pendingCodeState: state,
      },
    },
    { upsert: true, new: true }
  );
  
  return state;
}

/**
 * Get the stored PKCE challenge details for a user
 * 
 * @param {string} email - User email
 * @param {string} state - State parameter from OAuth callback
 * @returns {Object|null} - PKCE details or null if not found/invalid
 */
export async function getPkceChallenge(email, state) {
  await dbConnect();
  
  const user = await User.findOne({
    email,
    pendingCodeState: state,
  });
  
  if (!user) {
    return null;
  }
  
  return {
    codeVerifier: user.pendingCodeVerifier,
    state: user.pendingCodeState,
  };
}

/**
 * Clear the PKCE challenge details for a user
 * 
 * @param {string} email - User email
 */
export async function clearPkceChallenge(email) {
  await dbConnect();
  
  await User.findOneAndUpdate(
    { email },
    {
      $unset: {
        pendingCodeVerifier: 1,
        pendingCodeState: 1,
      },
    }
  );
}

/**
 * Update a user's OAuth tokens
 * 
 * @param {string} email - User email
 * @param {Object} tokens - OAuth tokens
 */
export async function updateUserTokens(email, tokens) {
  await dbConnect();
  
  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.expiresAt,
      },
    },
    { upsert: true }
  );
}

/**
 * Get user from the access token
 * 
 * @param {string} token - JWT access token
 * @returns {Object|null} - User object or null if invalid
 */
export async function getUserFromToken(token) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }
    
    await dbConnect();
    return await User.findById(decoded.id).select('-pendingCodeVerifier -pendingCodeState');
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * Middleware to protect routes requiring authentication
 * 
 * @param {Request} request - Next.js request object
 * @returns {Object|Response} - User object or error response
 */
export async function authMiddleware(request) {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Unauthorized: No valid token provided', 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify and get user from token
  const user = await getUserFromToken(token);
  if (!user) {
    return errorResponse('Unauthorized: Invalid token', 401);
  }
  
  return user;
}