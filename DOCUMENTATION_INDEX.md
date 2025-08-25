# Documentation Index - KidEvent (RightHere)

This directory contains comprehensive documentation for the RightHere afterschool activity management platform. Choose the document that best fits your needs:

## 📚 Available Documentation

### 🏠 **README.md** 
**Purpose**: Main project overview and business workflows  
**Best for**: Understanding the application's purpose, user stories, and testing workflows  
**Contains**: Business requirements, user workflows, success criteria, and testing guidelines

### 🏗️ **PROJECT_STRUCTURE.md** ⭐ *NEW*
**Purpose**: Complete technical architecture and file organization guide  
**Best for**: New developers joining the project or anyone needing to understand the codebase structure  
**Contains**: 
- Directory structure explanation
- Where to find backend actions/API routes
- Database schema and entity locations  
- Frontend component organization
- Configuration file purposes

### 🚀 **DEVELOPER_GUIDE.md** ⭐ *NEW*
**Purpose**: Quick reference for common development tasks  
**Best for**: Daily development work and quick lookups  
**Contains**:
- "I need to..." task-based navigation
- Code patterns and examples
- Common commands and debugging tips
- File naming conventions

### 🔧 **replit.md**
**Purpose**: System architecture deep dive and deployment details  
**Best for**: Understanding technical architecture decisions and external dependencies  
**Contains**: Frontend/backend architecture, authentication systems, data storage design

### 🧪 **test-documentation.md**
**Purpose**: Testing framework and methodology  
**Best for**: Understanding and working with the test suite  
**Contains**: Test categories, running tests, coverage areas, best practices

## 🎯 Quick Navigation by Need

### I want to understand...

| What you need | Go to |
|---------------|-------|
| **What this app does** | README.md |
| **How the code is organized** | PROJECT_STRUCTURE.md |
| **Where to add a new API endpoint** | DEVELOPER_GUIDE.md → "Add a new API endpoint" |
| **Database schema and tables** | PROJECT_STRUCTURE.md → "Database Schema & Entities" |
| **How to run tests** | test-documentation.md |
| **System architecture decisions** | replit.md |
| **Where backend actions are defined** | PROJECT_STRUCTURE.md → "Backend Actions" |
| **How authentication works** | replit.md → "Authentication & Authorization" |

### I need to find...

| Component | Location | Documentation |
|-----------|----------|---------------|
| **API Routes** | `/server/routes.ts` | PROJECT_STRUCTURE.md |
| **Database Schema** | `/shared/schema.ts` | PROJECT_STRUCTURE.md |
| **React Components** | `/client/src/components/` | PROJECT_STRUCTURE.md |
| **Business Logic** | `/server/storage.ts` | PROJECT_STRUCTURE.md |
| **Authentication** | `/server/auth.ts`, `/server/replitAuth.ts` | replit.md |
| **Tests** | `/tests/` | test-documentation.md |
| **Database Migrations** | `drizzle.config.ts` | PROJECT_STRUCTURE.md |

## 🔄 Documentation Updates

- **PROJECT_STRUCTURE.md** - Created comprehensive guide to codebase organization
- **DEVELOPER_GUIDE.md** - Created quick reference for daily development tasks

These new documents complement the existing documentation by providing:
1. **Clear navigation** for finding specific code components
2. **Practical examples** for common development tasks  
3. **Structured overview** of the entire codebase organization

## 🚦 Getting Started Recommended Reading Order

1. **README.md** - Understand what the app does
2. **PROJECT_STRUCTURE.md** - Learn how the code is organized  
3. **DEVELOPER_GUIDE.md** - Reference for daily development
4. **replit.md** - Deep dive into architecture (as needed)
5. **test-documentation.md** - When working with tests

---

*This documentation is maintained alongside the codebase. When adding new features or changing architecture, please update the relevant documentation files.*