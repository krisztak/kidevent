# RightHere - Afterschool Activity Management Platform

## Overview

RightHere is a comprehensive mobile-first platform for managing afterschool activities. It connects parents with activity providers, enables event registration, and provides role-based management tools for administrators and staff.

## Main Business Workflows

### 1. Parent Registration & Onboarding
**Goal**: New parents can create accounts and set up their profile

**Steps**:
1. Visit landing page at `/`
2. Click "Create Account" 
3. Fill registration form with email, password, first name, last name, phone
4. Submit registration → Auto-login → Redirect to main app
5. Complete profile information in Account Settings if needed
6. Add first child profile with medical/dietary information

**Success Criteria**:
- Account created in database with `authType: 'email'`
- User automatically logged in after registration
- Profile completion validation works
- Child can be added with complete information

### 2. Parent Event Discovery & Registration
**Goal**: Parents can browse events and register their children

**Steps**:
1. Login as parent user
2. Navigate to "Events" tab
3. Browse available events (see Open, Registration Closed, Full statuses)
4. Click on event to view details
5. Select child for registration
6. Choose any extra services
7. Confirm registration with credits

**Success Criteria**:
- Events filtered appropriately (no past/editing events for parents)
- Registration prevents double-booking
- Seat count decreases after registration
- Credits system works correctly
- Registration appears in "My Events" tab

### 3. Admin Event Management
**Goal**: Administrators can create, edit, and manage the complete event lifecycle

**Steps**:
1. Login as admin user
2. Navigate to "Events" tab (shows admin interface)
3. View events with status filtering (All, Open, Registration Closed, Full, Past, Editing)
4. Create new event with all details (location, time, supervisors, services)
5. Edit existing event:
   - Click "Edit Event" → Status changes to "editing"
   - Modify event details
   - Choose: "Save & Publish" (→ open) OR "Save for Later" (→ editing) OR "Delete" (→ soft delete)

**Success Criteria**:
- Admin sees all events including past/editing status
- Status badges display correctly with colors
- Edit functionality changes status to "editing"
- Three-action save system works (publish/save/delete)
- Soft deletion hides events but preserves data
- Status filtering works for all status types

### 4. Staff Supervision Management
**Goal**: Staff can view and manage events they supervise

**Steps**:
1. Login as staff user
2. Navigate to "Supervised Events" tab
3. View events assigned as supervisor
4. Access event participant lists
5. Manage event-day logistics

**Success Criteria**:
- Staff sees only events they supervise
- Can view registered participants
- Events display with status information

### 5. User Role Management (Admin Only)
**Goal**: Admins can manage user roles and permissions

**Steps**:
1. Login as admin
2. Navigate to "Staff Management" tab
3. Search for users by email/name
4. View user roles and change permissions
5. Assign staff/admin roles as needed

**Success Criteria**:
- Search functionality works
- Role changes persist in database
- Access control enforced based on roles

### 6. Multi-Authentication Support
**Goal**: Users can access the platform via email/password or Replit OAuth

**Steps**:
- **Email/Password**: Register → Login with credentials
- **Replit OAuth**: Click "Continue with Replit" → OAuth flow → Auto account creation

**Success Criteria**:
- Both authentication methods work seamlessly
- Unified user experience regardless of auth method
- Session management works for both types

### 7. Event Status Lifecycle Management
**Goal**: Events automatically transition through statuses based on time and capacity

**Status Flow**:
- **Open** → Registration available, seats remaining
- **Registration Closed** → Past cutoff time, event still future
- **Full** → No remaining seats, event still future  
- **Past** → Event date has passed (admin-only visibility)
- **Editing** → Admin is modifying event (admin-only visibility)

**Success Criteria**:
- Status calculation works correctly based on time/capacity
- Parents see appropriate events for registration
- Admins see all events with proper status indicators
- Status badges display with correct colors

### 8. Profile Completion & Validation
**Goal**: Ensure users complete required information before key actions

**Steps**:
1. Login with incomplete profile
2. Try to add child → Blocked with helpful message
3. Complete profile in Account Settings
4. Retry adding child → Success

**Success Criteria**:
- Profile completion validation enforced
- Clear guidance provided to users
- Smooth progression after completion

## Technical Validation Tests

### Authentication Systems
- [ ] Email/password signup and login work
- [ ] Replit OAuth flow functions properly
- [ ] Session persistence across browser refreshes
- [ ] Logout functionality works

### Event Management
- [ ] Event creation with all fields
- [ ] Status calculation accuracy
- [ ] Event editing with three-action system
- [ ] Soft deletion and restoration
- [ ] Status filtering in admin interface

### Registration System
- [ ] Prevent double registration
- [ ] Seat count management
- [ ] Credits system calculation
- [ ] Registration history tracking

### Role-Based Access Control
- [ ] Admin-only features protected
- [ ] Staff supervision features work
- [ ] Parent access appropriately limited
- [ ] Role changes take effect immediately

### User Interface
- [ ] Mobile-responsive design
- [ ] Status badges display correctly
- [ ] Loading states and error handling
- [ ] Form validation and submission

### Database Integrity
- [ ] Proper foreign key relationships
- [ ] Data consistency across operations
- [ ] Migration system works
- [ ] Soft deletes preserve referential integrity

## Key Business Rules

1. **Event Visibility**: Parents only see Open/Registration Closed/Full events. Admins see all.
2. **Registration Cutoffs**: No registration after cutoff time passes.
3. **Seat Management**: Real-time seat counting prevents overbooking.
4. **Profile Requirements**: Complete profile required before adding children.
5. **Role Permissions**: Strict role-based access to features.
6. **Data Preservation**: Soft deletes preserve registration history.
7. **Status Priority**: Past events show as "past" regardless of other conditions.
8. **Credit System**: Events require specific credit amounts for registration.

## Success Metrics

- User registration completion rate
- Event discovery to registration conversion
- Admin workflow efficiency
- Zero data loss on event modifications
- Role-based security compliance
- Mobile usability scores
- System performance under load

## Testing Against Workflows

To validate the build against these workflows:

1. **Create test accounts** for each role (parent, staff, admin)
2. **Execute each workflow** step-by-step
3. **Verify success criteria** are met
4. **Test error scenarios** and edge cases
5. **Validate business rules** enforcement
6. **Confirm UI/UX** meets mobile-first requirements

This README serves as both documentation and a comprehensive test plan for the RightHere platform.