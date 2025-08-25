# KidEvent (RightHere) - Project Structure Guide

## Project Overview

**RightHere** is a comprehensive mobile-first platform for managing afterschool activities. It connects parents with activity providers, enables event registration, and provides role-based management tools for administrators and staff.

### Key Features
- Multi-role user management (Admin, Staff, User/Parent, Attendee/Child)
- Event creation and management with capacity tracking
- Registration system with credit-based payments
- Dual authentication support (Email/Password + Replit OAuth)
- Mobile-first responsive design
- Real-time seat availability tracking

## Technology Stack

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with dual strategy support
- **Session Management**: PostgreSQL-backed sessions

### Frontend  
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with custom theming

## Directory Structure

```
kidevent/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   └── main.tsx       # Application entry point
│   └── index.html         # HTML template
├── server/                # Backend Express application
│   ├── auth.ts           # Email/password authentication logic
│   ├── db.ts             # Database connection setup
│   ├── index.ts          # Server entry point and middleware
│   ├── replitAuth.ts     # Replit OAuth authentication
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations and business logic
│   └── vite.ts           # Development server integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and TypeScript types
├── tests/               # Test suite
│   ├── components/      # React component tests
│   ├── functionality/   # Business logic tests
│   ├── integration/     # Cross-system integration tests
│   ├── utils/          # Utility function tests
│   └── setup.ts        # Jest configuration
├── drizzle.config.ts    # Database migration configuration
└── package.json         # Dependencies and scripts
```

## Where to Find Different Components

### 🔧 Backend Actions (API Routes)

**Location**: `/server/routes.ts`

The main API routes are defined in this single file and include:

#### Authentication Routes
- `GET /api/auth/user` - Get current user information
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout current user
- `GET /api/login` - Replit OAuth login
- `GET /api/callback` - OAuth callback handler

#### User Management Routes
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/search` - Search users by email/name
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/role` - Update user role (Admin only)

#### Child/Attendee Routes
- `GET /api/children` - Get user's children
- `POST /api/children` - Add new child
- `PUT /api/children/:id` - Update child information
- `DELETE /api/children/:id` - Remove child

#### Event Routes
- `GET /api/events` - List events (filtered by user role)
- `POST /api/events` - Create new event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Soft delete event (Admin only)
- `GET /api/events/:id/registrations` - Get event registrations

#### Registration Routes
- `POST /api/registrations` - Register for event
- `GET /api/registrations` - Get user's registrations
- `DELETE /api/registrations/:id` - Cancel registration

### 🗃️ Database Schema & Entities

**Location**: `/shared/schema.ts`

This file contains all database table definitions and TypeScript types:

#### Core Tables
- **users** - User accounts (parents, staff, admins)
- **attendee** - Children/attendees linked to parents
- **events** - Activity events with scheduling and capacity
- **eventRegistrations** - Registration records linking attendees to events
- **eventSupervisors** - Staff assignments to events
- **sessions** - Session storage for authentication

#### Key Entity Types
```typescript
// User roles and authentication
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff" | "user" | "attendee";
  authType: "email" | "replit";
  // ... other fields
}

// Event with full details
type Event = {
  id: string;
  name: string;
  type: string;
  startTime: Date;
  location: string;
  maxSeats: number;
  remainingSeats: number;
  creditsRequired: number;
  status: "open" | "registration_closed" | "full" | "past" | "editing";
  // ... other fields
}

// Registration linking attendees to events
type EventRegistration = {
  id: string;
  eventId: string;
  attendeeId: string;
  creditsCost: number;
  servicesCost: number;
  selectedServices: number[];
  registeredAt: Date;
}
```

### 🔄 Database Migrations

**Configuration**: `/drizzle.config.ts`

```typescript
export default defineConfig({
  out: "./migrations",           // Migration files output directory
  schema: "./shared/schema.ts",  // Schema source file
  dialect: "postgresql",        // Database type
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

**Migration Commands**:
- `npm run db:push` - Push schema changes to database (current approach)
- `drizzle-kit generate` - Generate migration files
- `drizzle-kit migrate` - Apply migrations

**Current Setup**: The project currently uses schema push (`db:push`) rather than formal migrations. This is common in development but migrations should be used for production deployments.

### 🎯 Business Logic & Data Operations

**Location**: `/server/storage.ts`

This file contains the `DatabaseStorage` class that implements all business logic:

#### Key Methods
- **User Operations**: `createUser()`, `getUser()`, `updateUser()`, `searchUsers()`
- **Event Operations**: `createEvent()`, `updateEvent()`, `getAllEvents()`, `getEventById()`
- **Registration Operations**: `registerForEvent()`, `getUserRegistrations()`, `cancelRegistration()`
- **Authentication**: `getUserByEmail()`, `getUserByReplitId()`
- **Seeding**: `seedEvents()`, `seedAdminUser()`

### 🔐 Authentication & Authorization

#### Email/Password Auth
**Location**: `/server/auth.ts`

- Local strategy configuration
- Password hashing with bcrypt
- User validation and middleware
- Admin role checking

#### Replit OAuth
**Location**: `/server/replitAuth.ts`

- OpenID Connect integration
- Token refresh handling
- Multi-domain support
- Session management

### 🖥️ Frontend Components

**Location**: `/client/src/components/`

#### Key Components
- **event-detail-modal.tsx** - Event details and registration form
- **create-event-modal.tsx** - Event creation form (Admin)
- **edit-event-modal.tsx** - Event editing interface (Admin)
- **admin-event-management.tsx** - Admin event management interface
- **staff-management.tsx** - User role management (Admin)
- **child-profile-card.tsx** - Child information display
- **header.tsx** - Navigation and user menu

#### Pages
**Location**: `/client/src/pages/`

- **home.tsx** - Main dashboard with events
- **login.tsx** - Authentication page
- **register.tsx** - User registration
- **settings.tsx** - User profile management
- **landing.tsx** - Public landing page

### 🧪 Testing Structure

**Location**: `/tests/`

#### Test Categories
- **components/** - React component tests
- **functionality/** - Business logic tests  
- **integration/** - Cross-system integration tests
- **utils/** - Utility function tests

#### Test Configuration
- **setup.ts** - Jest configuration and mocks
- **test-helpers.ts** - Common test utilities

### ⚙️ Configuration Files

#### Build & Development
- **vite.config.ts** - Frontend build configuration
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind CSS configuration
- **jest.config.js** - Test runner configuration

#### Database
- **drizzle.config.ts** - Database migration settings
- **/server/db.ts** - Database connection setup

## Development Workflow

### Starting the Application
```bash
npm install              # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
```

### Database Operations
```bash
npm run db:push         # Push schema changes to database
npm run check           # TypeScript type checking
```

### Testing
```bash
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
```

## Key Business Rules

1. **Role-Based Access**: Strict permissions based on user roles
2. **Event Visibility**: Parents only see available events, admins see all
3. **Registration Rules**: Prevent double-booking and enforce capacity limits
4. **Profile Requirements**: Complete profile needed before adding children
5. **Soft Deletes**: Events are marked deleted but data is preserved
6. **Credit System**: Events require specific credit amounts for registration

## Architecture Highlights

### Type Safety
- Shared TypeScript types between frontend and backend
- Drizzle ORM provides compile-time type checking
- Zod schemas for runtime validation

### Authentication
- Dual authentication support (email/password + OAuth)
- Session-based authentication with PostgreSQL storage
- Role-based authorization middleware

### Mobile-First Design
- Responsive Tailwind CSS
- Touch-friendly interface components
- Optimized for mobile usage patterns

### Real-Time Features
- Live seat availability updates
- Automatic event status calculation
- Optimistic UI updates with React Query

This structure provides a clear separation of concerns while maintaining type safety and code reusability across the entire application.