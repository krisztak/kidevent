import {
  users,
  attendee,
  events,
  eventRegistrations,
  eventSupervisors,
  type User,
  type ExtraService,
  type UpsertUser,
  type Child,
  type InsertChild,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type EventStatus,
  calculateEventStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (supports both email/password and Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  createAdminUser(email: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  
  // Child operations
  getChildrenByParentId(parentId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, child: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: string): Promise<boolean>;
  getChild(id: string): Promise<Child | undefined>;
  
  // Event operations
  getAllEvents(includeDeleted?: boolean): Promise<Event[]>;
  getAllEventsForAdmin(): Promise<Event[]>; // Shows all events including past and editing for admin
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  updateEventStatus(id: string, status: EventStatus): Promise<Event | undefined>;
  softDeleteEvent(id: string): Promise<boolean>;
  restoreEvent(id: string): Promise<boolean>;
  updateEventSupervisors(eventId: string, staffIds: string[]): Promise<void>;
  getEventsForUser(): Promise<any[]>;
  updateEventSeats(eventId: string, seatsChange: number): Promise<Event | undefined>;
  getSupervisedEventsByStaff(staffId: string): Promise<Event[]>;
  
  // Event registration operations
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  getEventRegistrationsByParent(parentId: string): Promise<EventRegistration[]>;
  getEventRegistrationsByEvent(eventId: string): Promise<EventRegistration[]>;
  getEventRegistrationsWithDetailsForParent(parentId: string): Promise<any[]>;
  isChildRegisteredForEvent(childId: string, eventId: string): Promise<boolean>;

  // User operations for staff selection
  getUsersByRoles(roles: string[]): Promise<User[]>;
  
  // Seeding
  seedEvents(): Promise<void>;
  seedAdminUser(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values([userData]).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([userData])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createAdminUser(email: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: `admin_${Date.now()}`,
        email,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      })
      .returning();
    return user;
  }
  
  // Child operations
  async getChildrenByParentId(parentId: string): Promise<Child[]> {
    return await db.select().from(attendee).where(eq(attendee.parentId, parentId));
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(attendee).values([child]).returning();
    return newChild;
  }

  async updateChild(id: string, childData: Partial<InsertChild>): Promise<Child | undefined> {
    const [updatedChild] = await db
      .update(attendee)
      .set({ ...childData, updatedAt: new Date() })
      .where(eq(attendee.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: string): Promise<boolean> {
    const result = await db.delete(attendee).where(eq(attendee.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(attendee).where(eq(attendee.id, id));
    return child;
  }
  
  // Event operations
  async getAllEvents(includeDeleted: boolean = false): Promise<any[]> {
    // Get all events with their primary staff information
    const eventsData = await db
      .select({
        id: events.id,
        name: events.name,
        type: events.type,
        startTime: events.startTime,
        location: events.location,
        maxSeats: events.maxSeats,
        remainingSeats: events.remainingSeats,
        creditsRequired: events.creditsRequired,
        staffId: events.staffId,
        duration: events.duration,
        description: events.description,
        image: events.image,
        cutoffHours: events.cutoffHours,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        extraServices: events.extraServices,
        servicesCurrency: events.servicesCurrency,
        allowedRegistrants: events.allowedRegistrants,
        status: events.status,
        deleted: events.deleted,
        // Get primary staff name for legacy staffId system
        primaryStaffName: sql<string | null>`CASE WHEN ${events.staffId} IS NOT NULL THEN CONCAT(staff.first_name, ' ', staff.last_name) ELSE NULL END`,
      })
      .from(events)
      .leftJoin(sql`users as staff`, eq(events.staffId, sql`staff.id`))
      .orderBy(desc(events.startTime));

    // Get all supervisors for these events (new many-to-many system)
    const supervisorsData = await db
      .select({
        eventId: eventSupervisors.eventId,
        supervisorId: eventSupervisors.supervisorId,
        supervisorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        supervisorEmail: users.email,
      })
      .from(eventSupervisors)
      .innerJoin(users, eq(eventSupervisors.supervisorId, users.id));

    // Filter out deleted events unless requested
    const filteredEvents = includeDeleted ? eventsData : eventsData.filter(event => !event.deleted);
    
    // Combine events with their supervisors and calculate status
    const result = filteredEvents.map(event => {
      const eventSupervisorsForEvent = supervisorsData.filter(s => s.eventId === event.id);
      
      // Handle both new supervisor system and old staffId system
      let allSupervisorNames: string[] = [];
      if (eventSupervisorsForEvent.length > 0) {
        // Use new many-to-many supervisor system
        allSupervisorNames = eventSupervisorsForEvent.map(s => s.supervisorName);
      } else if (event.primaryStaffName) {
        // Fallback to legacy staffId system
        allSupervisorNames = [event.primaryStaffName];
      }
      
      // Calculate current status based on event data
      const calculatedStatus = calculateEventStatus(event);
      
      return {
        ...event,
        status: calculatedStatus, // Override with calculated status
        supervisors: eventSupervisorsForEvent,
        supervisorName: eventSupervisorsForEvent.length > 0 ? eventSupervisorsForEvent[0].supervisorName : event.primaryStaffName, // For backward compatibility
        supervisorNames: allSupervisorNames.join(', '), // All supervisor names
      };
    });
    
    return result;
  }

  async getAllEventsForAdmin(): Promise<any[]> {
    // Admin sees all events including past and editing status
    return this.getAllEvents(true); // Include deleted events for admin
  }

  async getEventsForUser(): Promise<any[]> {
    // Regular users don't see past, editing, or deleted events
    const allEvents = await this.getAllEvents(false); // Don't include deleted
    return allEvents.filter(event => 
      event.status !== "past" && event.status !== "editing"
    );
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent & { staffIds?: string[] }): Promise<Event> {
    // Ensure proper type handling for jsonb arrays
    const { staffIds, ...eventData } = event;
    const finalEventData = {
      ...eventData,
      extraServices: Array.isArray(eventData.extraServices) ? eventData.extraServices as ExtraService[] : [],
    };
    
    const [newEvent] = await db.insert(events).values([{
      ...finalEventData,
      status: "open" as const // Ensure proper type for status field
    }]).returning();
    
    // Create supervisor relationships
    if (staffIds && staffIds.length > 0) {
      const supervisorData = staffIds.map(staffId => ({
        eventId: newEvent.id,
        supervisorId: staffId,
      }));
      await db.insert(eventSupervisors).values(supervisorData);
    }
    
    return newEvent;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    // Filter out undefined values and handle type conversion
    const updateData = Object.fromEntries(
      Object.entries(eventData).filter(([_, v]) => v !== undefined)
    );
    
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async updateEventStatus(id: string, status: EventStatus): Promise<Event | undefined> {
    const [updated] = await db
      .update(events)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async softDeleteEvent(id: string): Promise<boolean> {
    const result = await db
      .update(events)
      .set({ 
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async restoreEvent(id: string): Promise<boolean> {
    const result = await db
      .update(events)
      .set({ 
        deleted: false,
        updatedAt: new Date()
      })
      .where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateEventSupervisors(eventId: string, staffIds: string[]): Promise<void> {
    // Remove existing supervisors
    await db.delete(eventSupervisors).where(eq(eventSupervisors.eventId, eventId));
    
    // Add new supervisors
    if (staffIds.length > 0) {
      const supervisorData = staffIds.map(staffId => ({
        eventId,
        supervisorId: staffId,
      }));
      await db.insert(eventSupervisors).values(supervisorData);
    }
  }

  async updateEventSeats(eventId: string, seatsChange: number): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set({ 
        remainingSeats: sql`${events.remainingSeats} + ${seatsChange}`,
        updatedAt: new Date() 
      })
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  }

  async getSupervisedEventsByStaff(staffId: string): Promise<any[]> {
    const result = await db
      .select({
        // Event fields
        id: events.id,
        name: events.name,
        type: events.type,
        startTime: events.startTime,
        location: events.location,
        maxSeats: events.maxSeats,
        remainingSeats: events.remainingSeats,
        creditsRequired: events.creditsRequired,
        staffId: events.staffId,
        duration: events.duration,
        description: events.description,
        image: events.image,
        cutoffHours: events.cutoffHours,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        extraServices: events.extraServices,
        servicesCurrency: events.servicesCurrency,
        allowedRegistrants: events.allowedRegistrants,
        // Supervisor fields
        supervisorName: sql<string | null>`CASE WHEN ${users.id} IS NOT NULL THEN CONCAT(${users.firstName}, ' ', ${users.lastName}) ELSE NULL END`,
        supervisorEmail: users.email
      })
      .from(events)
      .leftJoin(users, eq(events.staffId, users.id))
      .where(eq(events.staffId, staffId))
      .orderBy(desc(events.startTime));
    
    return result;
  }
  
  // Event registration operations
  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    // Ensure proper type handling for jsonb arrays
    const registrationData = {
      ...registration,
      selectedServices: Array.isArray(registration.selectedServices) ? registration.selectedServices as number[] : [],
    };
    const [newRegistration] = await db.insert(eventRegistrations).values([registrationData]).returning();
    return newRegistration;
  }

  async getEventRegistrationsByParent(parentId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.parentId, parentId));
  }

  async getEventRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getEventRegistrationsWithDetailsForParent(parentId: string): Promise<any[]> {
    const registrations = await db
      .select({
        eventId: eventRegistrations.eventId,
        childId: eventRegistrations.childId,
        parentId: eventRegistrations.parentId,
        registeredAt: eventRegistrations.registeredAt,
        creditsCost: eventRegistrations.creditsCost,
        servicesCost: eventRegistrations.servicesCost,
        selectedServices: eventRegistrations.selectedServices,
        event: {
          id: events.id,
          name: events.name,
          type: events.type,
          startTime: events.startTime,
          location: events.location,
          duration: events.duration,
          image: events.image,
          description: events.description,
        },
        child: {
          id: attendee.id,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
        }
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .innerJoin(attendee, eq(eventRegistrations.childId, attendee.id))
      .where(eq(eventRegistrations.parentId, parentId))
      .orderBy(events.startTime);
    
    return registrations;
  }

  async isChildRegisteredForEvent(childId: string, eventId: string): Promise<boolean> {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.childId, childId),
          eq(eventRegistrations.eventId, eventId)
        )
      );
    return !!registration;
  }



  // User operations for staff/guest selection
  async getUsersByRoles(roles: string[]): Promise<User[]> {
    return await db.select().from(users).where(inArray(users.role, roles)).orderBy(users.firstName);
  }
  
  // Seeding
  async seedEvents(): Promise<void> {
    const existingEvents = await this.getAllEvents();
    if (existingEvents.length > 0) return; // Already seeded

    const seedEvents: InsertEvent[] = [
      {
        name: "Creative Arts Workshop",
        type: "afterschool",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        location: "Art Room A",
        maxSeats: 5,
        remainingSeats: 2,
        creditsRequired: 3,
        staffId: "staff_1",
        duration: "3h",
        description: "Let your child explore their creativity through painting, drawing, and crafts in our well-equipped art studio. All materials provided.",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        cutoffHours: 12,
        extraServices: [{ description: "Food", price: 10 }],
      },
      {
        name: "Science Discovery Lab",
        type: "afterschool",
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        location: "Lab 101",
        maxSeats: 3,
        remainingSeats: 1,
        creditsRequired: 4,
        staffId: "staff_2",
        duration: "2.5h",
        description: "Hands-on experiments and discoveries await! Perfect for curious minds who love to explore how things work.",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        cutoffHours: 12,
        extraServices: [],
      },
      {
        name: "Soccer Skills Training",
        type: "afterschool",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        location: "Field A",
        maxSeats: 8,
        remainingSeats: 0,
        creditsRequired: 2,
        staffId: "staff_3",
        duration: "2h",
        description: "Build teamwork and soccer skills in a fun, supportive environment. All skill levels welcome!",
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        cutoffHours: 12,
        extraServices: [{ description: "Snacks", price: 5 }],
      },
    ];

    for (const event of seedEvents) {
      await this.createEvent(event);
    }
  }

  async seedAdminUser(): Promise<void> {
    // Check if admin user already exists
    const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
    if (adminUsers.length > 0) return; // Admin already exists

    // Create a default admin user
    await this.createAdminUser("admin@righthereapp.com");
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
