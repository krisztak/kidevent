import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { signupSchema, loginSchema, type SignupData, type LoginData, type User } from "@shared/schema";
import { z } from "zod";

// Configure Local Strategy for email/password authentication
export function setupLocalAuth() {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (user.authType !== 'email' || !user.password) {
          return done(null, false, { message: 'Please sign in with your original method' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password utility
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Authentication middleware for email/password or Replit auth
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Admin middleware
export function createIsAdminMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get current user data from database to ensure role is up to date
      let user;
      const sessionUser = req.user as any;
      
      if (sessionUser.claims) {
        // Replit OAuth user - get from database by Replit ID
        const userId = sessionUser.claims.sub;
        user = await storage.getUserByReplitId(userId);
      } else {
        // Email/password user - session user should have current data
        user = sessionUser;
      }
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      return next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({ message: "Failed to verify admin status" });
    }
  };
}

// Validate signup data
export function validateSignup(data: any): SignupData {
  return signupSchema.parse(data);
}

// Validate login data
export function validateLogin(data: any): LoginData {
  return loginSchema.parse(data);
}