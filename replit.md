# Overview

RightHere is a mobile-first afterschool activity management platform built with React, Express, and PostgreSQL. The application allows parents to discover and register their children for afterschool events and activities. It features a modern UI with Tailwind CSS and shadcn/ui components, dual authentication support (custom email/password + Replit OAuth), role-based access control, and a credit-based event registration system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing with conditional rendering based on authentication state
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom color variables for the RightHere brand (greens and yellows with sunflower theme)
- **Mobile-First Design**: Responsive layout optimized for mobile devices with a maximum width container

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **API Design**: RESTful API with proper HTTP status codes and error handling
- **Middleware**: Custom logging middleware for API requests with response time tracking
- **File Structure**: Separation of concerns with dedicated modules for routes, storage, authentication, and database connections

## Authentication & Authorization
- **Dual Authentication System**: 
  - Email/password authentication with bcrypt password hashing and Passport Local Strategy
  - Replit OAuth integration using OpenID Connect (maintained for existing users)
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Security**: HTTP-only cookies, secure session configuration, password hashing with bcrypt (12 rounds)
- **User Flow**: 
  - Complete signup flow with profile information collection (first name, last name, email, phone)
  - Automatic login after successful signup
  - Profile completion validation before allowing child registration
  - Supports both authentication methods with unified user experience

## Data Storage & Schema
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Design**: 
  - Users table supporting both email/password and Replit OAuth authentication with profile completion tracking
  - Role-based access control with four user types: admin, staff, user (parents), attendee (children display as "children" in frontend)
  - Children table with detailed profiles including medical and dietary information  
  - Events table with scheduling, capacity, and credit requirements
  - Event registrations table linking children to events
  - Sessions table for authentication state persistence
- **Relationships**: Foreign key constraints with cascading deletes for data integrity
- **Validation**: Zod schemas for runtime type checking and API request validation

## Key Features
- **Dual Authentication**: Custom email/password signup with profile completion requirements alongside Replit OAuth
- **Role-Based Access Control**: Four user types (admin, staff, user, attendee) with appropriate permissions and access levels
- **Staff Management**: Admin-only tab for managing user roles, searching users, and assigning staff/user permissions
- **Profile Completion Validation**: Users must complete their profile (first name, last name, email, phone) before adding children
- **Event Management**: Browse events with filtering, capacity tracking, and credit-based registration
- **Child Profiles**: Comprehensive child information including emergency contacts, allergies, and dietary restrictions
- **Registration System**: Prevent double-booking and track available seats in real-time with user-friendly error handling
- **Account Settings**: Dedicated settings page for profile management with completion status indicators
- **Responsive UI**: Mobile-optimized interface with tab navigation and modal interactions
- **Collapsible Registration**: Event registration section organized into clean dropdown interface for better UX
- **Comprehensive Testing**: Automated test suite covering key functionalities with watch mode for continuous validation

# External Dependencies

## Core Technologies
- **React Ecosystem**: React 18, TypeScript, Vite for the frontend development stack
- **Express.js**: Node.js web framework for the backend API
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and keyboard navigation
- **Lucide React**: Icon library for consistent iconography

## Authentication & Session Management
- **Replit OAuth**: OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware with OpenID Client strategy
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Development & Build Tools
- **Vite**: Frontend build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **Wouter**: Minimalist routing library for React
- **Jest**: Testing framework with TypeScript support and jsdom environment
- **React Testing Library**: Component testing utilities for React applications
- **Chokidar**: File system watcher for automated test execution on code changes

## Data & API Management
- **TanStack Query**: Server state management with caching and synchronization
- **Zod**: Runtime type validation for API requests and responses
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: Unique ID generation for resources

## Database & Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL client with WebSocket support
- **ws**: WebSocket library for database connections
- **drizzle-kit**: CLI tools for database migrations and schema management

## Testing Infrastructure
- **Automated Test Suite**: Comprehensive tests covering event management, authentication, registration logic, and UI components
- **Test Categories**:
  - Integration tests for event registration and capacity management
  - Authentication and authorization validation tests
  - Role-based access control verification
  - Registration permissions and double-booking prevention
  - Profile completion and user session management
- **Test Automation**: 
  - `node run-tests.js`: Manual test execution with summary reporting
  - `node watch-tests.js`: Continuous testing with file system monitoring
  - Tests run automatically when source files change in client/, server/, shared/, or tests/ directories
- **Coverage**: Tests validate core business logic including capacity calculations, cutoff time validation, role permissions, and registration state management