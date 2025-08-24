# RightHere Testing Framework

## Overview
Comprehensive automated testing framework covering key functionalities of the RightHere afterschool activity management platform.

## Test Categories

### 1. Integration Tests (`tests/integration/`)
- **Event Management**: Capacity calculations, registration limits, cutoff time validation
- **Registration Logic**: Double-booking prevention, role-based permissions, seat availability
- **User Roles**: Admin, staff, user permissions and access control validation

### 2. Functionality Tests (`tests/functionality/`)  
- **Authentication**: Error detection, profile completion, session management
- **Authorization**: Role-based access control with hierarchical permissions
- **Profile Validation**: Complete vs incomplete user profile detection

### 3. Component Tests (`tests/components/`)
- **Event Detail Modal**: Registration dropdown, collapsible UI, status display
- **Event Card**: Capacity display, supervisor info, category icons
- **Registration Flow**: Permission validation, user selection, booking prevention

### 4. Utility Tests (`tests/utils/`)
- **Authentication Utils**: 401 error detection, unauthorized state handling
- **Test Helpers**: Mock data generation, query client utilities

## Running Tests

### Manual Execution
```bash
node run-tests.js
```
- Runs focused test suite with clean output
- Provides summary of passed/failed tests
- Exits with appropriate status codes

### Continuous Testing
```bash
node watch-tests.js
```
- Automatically runs tests when files change
- Monitors client/, server/, shared/, tests/ directories
- Debounced execution to prevent excessive test runs
- Clean console output with change notifications

### Direct Jest Commands
```bash
# Run all tests
npx jest

# Run specific test categories
npx jest tests/integration
npx jest tests/functionality

# Run with coverage
npx jest --coverage

# Run in watch mode
npx jest --watch
```

## Test Coverage Areas

### Core Business Logic
- Event registration capacity management
- Registration deadline enforcement (cutoff hours)
- Double registration prevention
- Role-based event access permissions
- Credit cost calculations

### Authentication & Authorization
- User session state management
- Profile completion validation
- Role hierarchy enforcement (admin > staff > user > attendee)
- Unauthorized access detection

### UI Component Behavior
- Collapsible registration section functionality
- Event status display (available, fully booked, deadline passed)
- Registration form validation and submission
- Child vs parent registration selection

### Data Integrity
- Event-attendee relationship validation
- Supervisor assignment tracking
- Registration state consistency
- Capacity vs registered count accuracy

## File Structure
```
tests/
├── components/           # React component tests
├── functionality/        # Business logic tests  
├── integration/         # Cross-system integration tests
├── utils/              # Utility function tests
├── scripts/            # Test automation scripts
├── setup.ts            # Jest configuration and mocks
└── test-helpers.ts     # Common test utilities
```

## Best Practices
- Tests validate real business logic, not just implementation details
- Mock external dependencies (database, API calls) while testing core logic
- Use descriptive test names that explain the expected behavior
- Group related tests in describe blocks for better organization
- Include both positive and negative test cases
- Test edge cases like capacity limits, deadline boundaries, permission boundaries

## Development Workflow
1. Write failing tests for new features first (TDD approach)
2. Implement feature until tests pass
3. Run watch mode during development for immediate feedback
4. Use manual test runner before committing changes
5. Ensure all tests pass before deployment