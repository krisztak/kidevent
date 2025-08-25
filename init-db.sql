# Database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_replit_id ON users(replit_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_attendee_parent_id ON attendee(parent_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_deleted ON events(deleted);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_supervisors_event_id ON event_supervisors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_supervisors_supervisor_id ON event_supervisors(supervisor_id);