# Developer Quick Reference - KidEvent (RightHere)

## Quick Navigation

### I need to...

#### 🔧 Add a new API endpoint
**Go to**: `/server/routes.ts`
**Pattern**: Add route handler using Express syntax
```typescript
app.get('/api/new-endpoint', isAuthenticated, async (req, res) => {
  // Your logic here
});
```

#### 🗃️ Add a new database table
**Go to**: `/shared/schema.ts`
**Pattern**: Define table using Drizzle schema
```typescript
export const newTable = pgTable("new_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```
**Don't forget**: Run `npm run db:push` to update database

#### 🎯 Add business logic
**Go to**: `/server/storage.ts`
**Pattern**: Add method to `DatabaseStorage` class
```typescript
async newOperation(): Promise<ReturnType> {
  return await db.select().from(tableName);
}
```

#### 🖥️ Create a new React component
**Go to**: `/client/src/components/`
**Pattern**: Create `.tsx` file with component export
```typescript
export function NewComponent() {
  return <div>Component content</div>;
}
```

#### 📄 Add a new page/route
**Go to**: `/client/src/pages/`
**Pattern**: Create page component and add to App.tsx routing

#### 🧪 Add tests
**Go to**: `/tests/` directory
- Component tests → `/tests/components/`
- Business logic → `/tests/functionality/`
- Integration tests → `/tests/integration/`

#### 🔐 Add authentication middleware
**Go to**: `/server/auth.ts` (email/password) or `/server/replitAuth.ts` (OAuth)

#### ⚙️ Update environment configuration
**Check**: Server startup in `/server/index.ts` and `/server/db.ts`

## Common Patterns

### Database Queries
```typescript
// Simple select
const users = await db.select().from(users);

// With conditions
const user = await db.select().from(users).where(eq(users.id, userId));

// With joins
const eventsWithRegistrations = await db
  .select()
  .from(events)
  .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId));
```

### API Error Handling
```typescript
try {
  // Your logic
  res.json(result);
} catch (error) {
  console.error("Error description:", error);
  res.status(500).json({ message: "Error message" });
}
```

### React Query Usage
```typescript
// In components
const { data, isLoading, error } = useQuery({
  queryKey: ['events'],
  queryFn: () => fetch('/api/events').then(r => r.json())
});
```

### Type Definitions
```typescript
// Export from schema.ts
export type NewType = typeof newTable.$inferSelect;
export type InsertNewType = typeof newTable.$inferInsert;
```

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `event-detail-modal.tsx`)
- **Pages**: `kebab-case.tsx` (e.g., `user-settings.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `authUtils.ts`)
- **Types**: PascalCase interfaces in `schema.ts`

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../path/to/component';

test('should render correctly', () => {
  render(<ComponentName />);
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

### API Testing
```typescript
// Mock storage in tests
jest.mock('../server/storage', () => ({
  storage: {
    methodName: jest.fn().mockResolvedValue(mockData)
  }
}));
```

## Debugging Tips

### Backend Debugging
- Check server logs in console
- API requests logged with timing in `/server/index.ts`
- Database connection issues: check `DATABASE_URL` env var

### Frontend Debugging
- React DevTools for component state
- Network tab for API calls
- React Query DevTools for cache inspection

### Database Debugging
- Use Drizzle Studio: `npx drizzle-kit studio`
- Check schema sync: `npm run db:push`

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run check                  # TypeScript checking
npm run build                  # Production build

# Database
npm run db:push               # Push schema to database
npx drizzle-kit studio        # Database GUI
npx drizzle-kit generate      # Generate migrations

# Testing
npm test                      # Run all tests
npm run test:watch           # Watch mode
node run-tests.js            # Manual test runner
```

## Environment Variables

Required for development:
```bash
DATABASE_URL=postgresql://...     # Database connection
REPL_ID=your-repl-id             # For Replit OAuth
REPLIT_DOMAINS=your-domain.com   # OAuth callback domains
```

## Key Dependencies

### Backend
- `express` - Web framework
- `drizzle-orm` - Database ORM
- `passport` - Authentication
- `bcryptjs` - Password hashing
- `zod` - Runtime validation

### Frontend
- `react` - UI framework
- `@tanstack/react-query` - State management
- `wouter` - Routing
- `@radix-ui/*` - UI primitives
- `tailwindcss` - Styling

### Development
- `typescript` - Type checking
- `vite` - Build tool
- `jest` - Testing framework
- `drizzle-kit` - Database tools