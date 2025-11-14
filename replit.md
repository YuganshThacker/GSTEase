# GST Ease - Billing & Inventory Management System

## Overview

GST Ease is a comprehensive business management platform designed for GST-compliant billing, inventory tracking, and financial reporting. The application provides small to medium-sized businesses with tools to manage products, customers, invoices, and generate tax reports while ensuring compliance with Indian GST regulations.

The system features a modern web interface built with React and a RESTful API backend, with real-time data synchronization and role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state management
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom design system

**Design System:**
- Custom typography using Inter (UI) and JetBrains Mono (numbers/code)
- Consistent spacing system based on Tailwind's 2/4/6/8 unit scale
- Professional color scheme with light/dark mode support via CSS variables
- Component-based architecture following "New York" shadcn/ui style variant

**Key Architectural Decisions:**
- **Component Library Choice:** Selected shadcn/ui for its flexibility (components are copied into the project rather than installed as dependencies), allowing full customization while maintaining consistency
- **State Management:** TanStack Query handles all server state, eliminating need for Redux/Zustand for API data. Local component state used for UI-only concerns
- **Form Handling:** React Hook Form with Zod validation for type-safe form schemas that match backend validation
- **Protected Routes:** Authentication state managed through React Query with automatic redirect to login for unauthenticated users

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for REST API
- **Database ORM:** Drizzle ORM with type-safe queries
- **Session Management:** express-session with PostgreSQL store
- **Authentication:** Replit Auth (OpenID Connect) via Passport.js

**API Design:**
- RESTful endpoints following standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Centralized error handling with appropriate HTTP status codes
- Request logging middleware for debugging and monitoring

**Data Layer:**
- **Storage Pattern:** Repository pattern implemented in `storage.ts` with interface-based design
- **Schema Validation:** Zod schemas shared between client and server for consistent validation
- **Database Migrations:** Managed through Drizzle Kit with migration files in `/migrations`

**Key Architectural Decisions:**
- **Monorepo Structure:** Client and server code in single repository with shared TypeScript types via `/shared` directory
- **Authentication Strategy:** Replit Auth chosen for seamless integration with Replit platform, providing OAuth without external service configuration
- **Session Storage:** PostgreSQL-backed sessions (required for Replit Auth) stored in dedicated `sessions` table
- **ORM Choice:** Drizzle ORM selected for its TypeScript-first approach, minimal runtime overhead, and SQL-like query builder

### Database Schema

**Core Entities:**
- **Users:** Authentication and profile data with role-based access (admin, staff, accountant)
- **Categories:** Product categorization for inventory organization
- **Products:** Inventory items with HSN codes, pricing, GST rates, and stock tracking
- **Customers:** Business and consumer customer records with GST numbers
- **Invoices:** GST-compliant invoices supporting B2B and B2C transactions
- **Invoice Items:** Line items linking products to invoices with quantities and calculations

**GST Compliance Features:**
- Support for CGST+SGST (intra-state) and IGST (inter-state) tax calculations
- HSN code tracking for products
- Customer GST number validation for B2B transactions
- Automatic tax calculation based on product GST rates and transaction type

**Key Design Decisions:**
- **UUID Primary Keys:** Using PostgreSQL `gen_random_uuid()` for distributed-friendly unique identifiers
- **Numeric Type for Currency:** Using `numeric` (DECIMAL) type for precise financial calculations avoiding floating-point errors
- **Enums for Fixed Options:** PostgreSQL enums for invoice types, statuses, and GST types ensuring data integrity
- **Timestamp Tracking:** `createdAt` and `updatedAt` fields on primary entities for audit trails

### External Dependencies

**Authentication Service:**
- **Replit Auth (OIDC):** Managed authentication service providing OAuth 2.0 / OpenID Connect
- **Integration:** Via `openid-client` library with Passport.js strategy
- **Session Store:** `connect-pg-simple` for PostgreSQL-backed Express sessions

**Database:**
- **Neon Serverless PostgreSQL:** Cloud-hosted PostgreSQL database
- **Connection:** Via `@neondatabase/serverless` driver with WebSocket support for serverless environments
- **Connection Pooling:** Built-in connection pooling through Neon's serverless driver

**UI Component Libraries:**
- **Radix UI:** Unstyled, accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Lucide React:** Icon library providing consistent iconography
- **shadcn/ui:** Pre-styled component implementations built on Radix UI

**Development Tools:**
- **TypeScript:** Type safety across entire stack
- **Vite Plugins:** Runtime error overlay, development banner, and source mapping for Replit environment
- **Drizzle Kit:** Database schema management and migration tooling

**Fonts:**
- **Google Fonts:** Inter and JetBrains Mono served via CDN

**Key Integration Decisions:**
- **Neon Database:** Chosen for serverless-friendly PostgreSQL with automatic scaling and WebSocket support required for edge deployments
- **Replit Platform Services:** Deep integration with Replit Auth and development tools for seamless platform experience
- **Zero External API Keys:** Authentication and database managed through Replit infrastructure, eliminating external service configuration