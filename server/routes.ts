import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isReplitAuthenticated } from "./replitAuth";
import { setupLocalAuth, isAuthenticated, createIsAdminMiddleware, hashPassword, validateSignup, validateLogin } from "./auth";
import { insertChildSchema, insertEventRegistrationSchema, insertEventSchema, updateUserSchema, isUserProfileComplete, type SignupData, type LoginData } from "@shared/schema";
import { z } from "zod";
import passport from "passport";

const registrationSchema = insertEventRegistrationSchema.extend({
  eventId: z.string().min(1, "Event ID is required"),
  childId: z.string().nullable(), // Allow null for parent registrations
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication strategies
  await setupAuth(app); // Replit OAuth
  setupLocalAuth(); // Email/password auth

  // Create admin middleware
  const isAdmin = createIsAdminMiddleware();

  // Seed events and admin user on startup
  await storage.seedEvents();
  await storage.seedAdminUser();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let user;
      if (req.user.claims) {
        // Replit OAuth user
        const userId = req.user.claims.sub;
        user = await storage.getUserByReplitId(userId);
      } else {
        // Email/password user
        user = req.user;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const signupData = validateSignup(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(signupData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(signupData.password);

      // Create user
      const newUser = await storage.createUser({
        email: signupData.email,
        password: hashedPassword,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: signupData.phone,
        authType: "email",
        isEmailVerified: false, // TODO: Implement email verification
      });

      // Log user in automatically
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in after signup" });
        }
        res.status(201).json({ 
          message: "Account created successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
            role: newUser.role,
            isEmailVerified: newUser.isEmailVerified,
          }
        });
      });
    } catch (error) {
      console.error("Error during signup:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid signup data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    try {
      validateLogin(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in" });
        }
        res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          }
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const profileData = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(userId, profileData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Events routes - filtered for regular users
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEventsForUser();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Admin events route - shows all events including past and editing status
  app.get('/api/admin/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEventsForAdmin();
      res.json(events);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch admin events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Supervised events route for staff and admin
  app.get('/api/supervised-events', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }

      // Check if user is staff or admin
      const user = req.user.claims 
        ? await storage.getUserByReplitId(userId) 
        : await storage.getUser(userId);
      
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied. Staff or admin role required." });
      }

      const supervisedEvents = await storage.getSupervisedEventsByStaff(userId);
      res.json(supervisedEvents);
    } catch (error) {
      console.error("Error fetching supervised events:", error);
      res.status(500).json({ message: "Failed to fetch supervised events" });
    }
  });

  // Event status management routes for admin
  app.put('/api/admin/events/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const eventId = req.params.id;
      
      const updatedEvent = await storage.updateEventStatus(eventId, status);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event status:", error);
      res.status(500).json({ message: "Failed to update event status" });
    }
  });

  app.delete('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      const success = await storage.softDeleteEvent(eventId);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.put('/api/admin/events/:id/restore', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      const success = await storage.restoreEvent(eventId);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event restored successfully" });
    } catch (error) {
      console.error("Error restoring event:", error);
      res.status(500).json({ message: "Failed to restore event" });
    }
  });

  // Update event route for admin
  app.put('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      const { staffIds, ...eventData } = req.body;
      
      // Convert startTime string to Date object before validation
      const processedEventData = {
        ...eventData,
        startTime: new Date(eventData.startTime),
        maxSeats: Number(eventData.maxSeats),
        remainingSeats: Number(eventData.remainingSeats),
        creditsRequired: Number(eventData.creditsRequired),
        cutoffHours: Number(eventData.cutoffHours),
        extraServices: eventData.extraServices || [],
      };
      
      const updatedEvent = await storage.updateEvent(eventId, processedEventData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Handle supervisor updates if staffIds provided
      if (Array.isArray(staffIds)) {
        // Remove existing supervisors and add new ones
        await storage.updateEventSupervisors(eventId, staffIds);
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Children routes
  app.get('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const children = await storage.getChildrenByParentId(userId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
        // Check if user profile is complete before allowing child creation
        const user = await storage.getUserByReplitId(userId);
        if (!isUserProfileComplete(user)) {
          return res.status(400).json({ 
            message: "Complete your profile before adding children. Please fill in your first name, last name, email, and phone number in Account Settings." 
          });
        }
      } else {
        // Email/password user
        userId = req.user.id;
        // Check if user profile is complete before allowing child creation
        const user = await storage.getUser(userId);
        if (!isUserProfileComplete(user)) {
          return res.status(400).json({ 
            message: "Complete your profile before adding children. Please fill in your first name, last name, email, and phone number in Account Settings." 
          });
        }
      }
      
      const childData = insertChildSchema.parse({
        ...req.body,
        parentId: userId,
      });
      
      const newChild = await storage.createChild(childData);
      res.status(201).json(newChild);
    } catch (error) {
      console.error("Error creating child:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid child data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.put('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const childId = req.params.id;
      
      // Verify child belongs to user
      const existingChild = await storage.getChild(childId);
      if (!existingChild || existingChild.parentId !== userId) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      const childData = insertChildSchema.partial().parse(req.body);
      const updatedChild = await storage.updateChild(childId, childData);
      
      if (!updatedChild) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      res.json(updatedChild);
    } catch (error) {
      console.error("Error updating child:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid child data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update child" });
    }
  });

  app.delete('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const childId = req.params.id;
      
      // Verify child belongs to user
      const existingChild = await storage.getChild(childId);
      if (!existingChild || existingChild.parentId !== userId) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      const deleted = await storage.deleteChild(childId);
      if (!deleted) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Event registration routes
  app.post('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const eventId = req.params.eventId;
      
      const registrationData = registrationSchema.parse({
        eventId,
        childId: req.body.childId || null,
        parentId: userId,
        selectedServices: req.body.selectedServices || [],
      });

      // Check if event exists and has seats available
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.remainingSeats <= 0) {
        return res.status(400).json({ message: "No seats available for this event" });
      }

      // Check cutoff time
      const cutoffTime = new Date(event.startTime);
      cutoffTime.setHours(cutoffTime.getHours() - event.cutoffHours);
      if (new Date() > cutoffTime) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }

      // Check allowed registrants - determine if this registration is allowed based on event settings
      const allowedRegistrants = event.allowedRegistrants || "attendee";
      const isChildRegistration = !!req.body.childId;
      const isParentRegistration = !req.body.childId; // Parent registering themselves

      if (allowedRegistrants === "attendee" && isParentRegistration) {
        return res.status(400).json({ message: "This event is only open to children (attendees)" });
      }
      
      if (allowedRegistrants === "user" && isChildRegistration) {
        return res.status(400).json({ message: "This event is only open to parents (users)" });
      }

      if (isChildRegistration) {
        // Child registration logic
        // Check if child is already registered
        const isAlreadyRegistered = await storage.isChildRegisteredForEvent(
          registrationData.childId!,
          eventId
        );
        if (isAlreadyRegistered) {
          return res.status(400).json({ message: "Child is already registered for this event" });
        }

        // Verify child belongs to parent
        const child = await storage.getChild(registrationData.childId!);
        if (!child || child.parentId !== userId) {
          return res.status(404).json({ message: "Child not found" });
        }
      } else {
        // Parent registration logic
        // Check if parent is already registered for this event
        const existingRegistrations = await storage.getEventRegistrationsByParent(userId);
        const isParentAlreadyRegistered = existingRegistrations.some(reg => 
          reg.eventId === eventId && reg.childId === null
        );
        
        if (isParentAlreadyRegistered) {
          return res.status(400).json({ message: "You are already registered for this event" });
        }
        
        // For parent registrations, childId should be null
        // We'll modify the data after validation since Zod expects a string
      }

      // Calculate costs separately
      const creditsCost = event.creditsRequired;
      const servicesCost = (req.body.selectedServices || []).reduce((total: number, serviceIndex: number) => {
        const service = event.extraServices?.[serviceIndex];
        return total + (service ? Math.round(service.price * 100) : 0); // Convert to cents
      }, 0);

      // Create registration with costs and update seat count
      const registrationWithCosts = {
        ...registrationData,
        childId: isParentRegistration ? null : registrationData.childId,
        creditsCost,
        servicesCost
      };
      const registration = await storage.createEventRegistration(registrationWithCosts);
      
      // Decrease seats for all child registrations, regardless of parent role
      // Staff/admin registering their children should count toward seat limits
      // Only staff supervising the event (registered as parent with no child) don't count
      if (isChildRegistration) {
        // Child registrations always count toward seat limits
        await storage.updateEventSeats(eventId, -1);
      } else {
        // Parent/self registrations: only count if not admin/staff
        let userRole;
        if (req.user.claims) {
          // Replit OAuth user
          const user = await storage.getUserByReplitId(userId);
          userRole = user?.role;
        } else {
          // Email/password user
          userRole = req.user.role;
        }
        
        // Only decrease seat count for parent registrations if not admin or staff
        if (userRole !== 'admin' && userRole !== 'staff') {
          await storage.updateEventSeats(eventId, -1);
        }
      }

      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating event registration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  app.get('/api/registrations', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const registrations = await storage.getEventRegistrationsByParent(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Get event registrations with detailed event and child information
  app.get('/api/my-events', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both email/password and Replit auth users
      let userId;
      if (req.user.claims) {
        // Replit OAuth user
        userId = req.user.claims.sub;
      } else {
        // Email/password user
        userId = req.user.id;
      }
      
      const registrations = await storage.getEventRegistrationsWithDetailsForParent(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching my events:", error);
      res.status(500).json({ message: "Failed to fetch my events" });
    }
  });

  // Admin routes for event management
  app.post('/api/admin/events', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Get admin user ID for potential auto-registration
      let adminUserId;
      if (req.user.claims) {
        // Replit OAuth user
        adminUserId = req.user.claims.sub;
      } else {
        // Email/password user
        adminUserId = req.user.id;
      }

      // Convert startTime string to Date object before validation
      const eventData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        maxSeats: Number(req.body.maxSeats),
        remainingSeats: Number(req.body.remainingSeats),
        creditsRequired: Number(req.body.creditsRequired),
        cutoffHours: Number(req.body.cutoffHours),
        extraServices: req.body.extraServices || [],
        allowedRegistrants: req.body.allowedRegistrants || "attendee",
        // Set the first selected staff member as the primary supervisor
        staffId: req.body.staffIds && req.body.staffIds.length > 0 ? req.body.staffIds[0] : null
      };
      
      const validatedData = insertEventSchema.parse(eventData);
      const newEvent = await storage.createEvent({
        ...validatedData,
        staffIds: req.body.staffIds // Pass the staffIds to create supervisor relationships
      });
      
      // Auto-register admin if they selected staff attending (staffIds contains their ID)
      if (req.body.staffIds && Array.isArray(req.body.staffIds) && req.body.staffIds.includes(adminUserId)) {
        try {
          await storage.createEventRegistration({
            eventId: newEvent.id,
            parentId: adminUserId,
            childId: null, // null for parent/staff registration
            selectedServices: [], // no extra services for auto-registration
          });
          
          // Note: Staff registrations do not decrease available seats
          // Available seats are for regular attendees only
        } catch (registrationError) {
          console.error("Error auto-registering admin for event:", registrationError);
          // Don't fail event creation if auto-registration fails
        }
      }
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Admin routes for user management
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get users by roles for staff selection
  app.get('/api/admin/users/by-roles', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const roles = req.query.roles ? req.query.roles.split(',') : [];
      if (roles.length === 0) {
        return res.status(400).json({ message: "Roles parameter is required" });
      }
      
      const users = await storage.getUsersByRoles(roles);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by roles:", error);
      res.status(500).json({ message: "Failed to fetch users by roles" });
    }
  });

  app.patch('/api/admin/users/:userId/role', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      // Validate role
      if (!['admin', 'staff', 'user', 'attendee'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Don't allow changing admin roles (security measure)
      if (role === 'admin') {
        return res.status(403).json({ message: "Cannot assign admin role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
