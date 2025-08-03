# Overview

TradeTracker Pro is a full-stack web application designed for tracking and analyzing trading performance. The application allows users to log their trades, monitor daily trading statistics, calculate profit/loss metrics, and visualize trading patterns. Built with a modern React frontend and Express backend, it provides a professional-grade interface for traders to manage their trading activities and improve their performance over time.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using React 18 with TypeScript, leveraging modern development patterns:
- **Component Library**: Radix UI components with shadcn/ui styling system for consistent, accessible UI elements
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching, with custom query functions for API communication
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The server-side follows a RESTful API design pattern:
- **Framework**: Express.js with TypeScript for type safety and modern JavaScript features
- **Authentication**: OpenID Connect (OIDC) integration with Replit's authentication system using Passport.js
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions
- **API Structure**: Organized route handlers with middleware for authentication and error handling
- **Database Access**: Repository pattern implementation with a storage interface for clean separation of concerns

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting for scalable cloud deployment
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: 
  - Users table for authentication data (required for Replit Auth)
  - Sessions table for session persistence (required for Replit Auth)
  - Trades table for tracking individual trading transactions with PnL calculations
- **Migration System**: Drizzle Kit for database schema versioning and migrations

## Authentication and Authorization
- **Provider**: Replit's OIDC authentication system for seamless integration
- **Session Strategy**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Security**: HTTP-only cookies with secure flags for production environments
- **User Management**: Automatic user creation/updates on successful authentication

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Authentication**: OIDC provider for user authentication and authorization

### Core Dependencies
- **Database**: Drizzle ORM with PostgreSQL adapter, Neon serverless client
- **Authentication**: Passport.js with OpenID Connect strategy, express-session
- **Frontend**: React 18, TanStack Query, Wouter routing, React Hook Form
- **UI Components**: Radix UI primitives, shadcn/ui component system
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Development**: Vite build tool, TypeScript compiler, tsx for development server

### Development Tools
- **Build System**: ESBuild for server bundling, Vite for client bundling
- **Type Safety**: TypeScript across the entire stack with strict configuration
- **Database Tools**: Drizzle Kit for migrations and schema management
- **Development Server**: tsx for hot-reloading Node.js development