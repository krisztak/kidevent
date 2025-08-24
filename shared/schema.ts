import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both email/password and Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  dateOfBirth: date("date_of_birth"), // New field for user date of birth
  password: varchar("password"), // For email/password auth (hashed)
  authType: varchar("auth_type").notNull().default("email"), // "email" or "replit"
  replitId: varchar("replit_id"), // For Replit OAuth users
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  role: varchar("role").notNull().default("user"), // "admin", "staff", "user", "attendee"
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendee table (children)
export const attendee = pgTable("attendee", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  secondaryContact: text("secondary_contact").notNull(),
  gender: varchar("gender"),
  dietaryRestrictions: text("dietary_restrictions"),
  allergies: text("allergies"),
  medicineNeeds: text("medicine_needs"),
  otherNotes: text("other_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Extra services definition
export interface ExtraService {
  description: string;
  price: number;
  currency?: string; // RON, EUR, USD
}

// Event status enum
export type EventStatus = "open" | "registration_closed" | "full" | "past" | "editing";

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("afterschool"),
  startTime: timestamp("start_time").notNull(),
  location: varchar("location").notNull(),
  maxSeats: integer("max_seats").notNull().default(3),
  remainingSeats: integer("remaining_seats").notNull().default(3),
  creditsRequired: integer("credits_required").notNull(),
  staffId: varchar("staff_id"),
  duration: varchar("duration").notNull().default("5h"),
  description: text("description").notNull(),
  image: varchar("image"),
  cutoffHours: integer("cutoff_hours").notNull().default(12),
  extraServices: jsonb("extra_services").$type<ExtraService[]>().notNull().default([]),
  servicesCurrency: varchar("services_currency").notNull().default("USD"), // Currency for extra services
  allowedRegistrants: varchar("allowed_registrants").notNull().default("attendee"), // "attendee", "user", "both"
  status: varchar("status").$type<EventStatus>().notNull().default("open"), // Event status
  deleted: boolean("deleted").notNull().default(false), // Soft deletion flag
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event supervisors table (many-to-many relationship)
export const eventSupervisors = pgTable("event_supervisors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  childId: varchar("child_id").references(() => attendee.id, { onDelete: 'cascade' }), // Nullable for parent registrations
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  selectedServices: jsonb("selected_services").$type<number[]>().notNull().default([]), // Array of service indices that were selected
  creditsCost: integer("credits_cost").notNull().default(0), // Base cost in credits
  servicesCost: integer("services_cost").notNull().default(0), // Additional services cost in cents
  registeredAt: timestamp("registered_at").defaultNow(),
});



// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(attendee),
  eventRegistrations: many(eventRegistrations),
  eventSupervisors: many(eventSupervisors),
}));

export const attendeeRelations = relations(attendee, ({ one, many }) => ({
  parent: one(users, {
    fields: [attendee.parentId],
    references: [users.id],
  }),
  eventRegistrations: many(eventRegistrations),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
  eventSupervisors: many(eventSupervisors),
}));

export const eventSupervisorsRelations = relations(eventSupervisors, ({ one }) => ({
  event: one(events, {
    fields: [eventSupervisors.eventId],
    references: [events.id],
  }),
  supervisor: one(users, {
    fields: [eventSupervisors.supervisorId],
    references: [users.id],
  }),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  child: one(attendee, {
    fields: [eventRegistrations.childId],
    references: [attendee.id],
  }),
  parent: one(users, {
    fields: [eventRegistrations.parentId],
    references: [users.id],
  }),
}));



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChildSchema = createInsertSchema(attendee).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registeredAt: true,
});

export const insertEventSupervisorSchema = createInsertSchema(eventSupervisors).omit({
  id: true,
  createdAt: true,
});



// Update schemas
export const updateUserSchema = insertUserSchema.partial();

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Child = typeof attendee.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Extended event type with supervisor information
export type EventWithSupervisor = Event & {
  supervisorName?: string | null;
  supervisorEmail?: string | null;
  supervisorNames?: string; // Combined names of all supervisors
  supervisors?: Array<{
    eventId: string;
    supervisorId: string;
    supervisorName: string;
    supervisorEmail: string;
  }>;
};

// Helper function to check if user profile is complete
export function isUserProfileComplete(user: User | undefined): boolean {
  if (!user) return false;
  return !!(user.firstName && user.lastName && user.email && user.phone);
}

// Helper function to calculate event status
export function calculateEventStatus(event: Event): EventStatus {
  const now = new Date();
  const eventDate = new Date(event.startTime);
  const cutoffTime = new Date(eventDate.getTime() - (event.cutoffHours * 60 * 60 * 1000));
  
  // Check if event has passed
  if (eventDate < now) {
    return "past";
  }
  
  // Check if event is full
  if (event.remainingSeats <= 0) {
    return "full";
  }
  
  // Check if registration cutoff has passed
  if (now > cutoffTime) {
    return "registration_closed";
  }
  
  // Default to open
  return "open";
}
