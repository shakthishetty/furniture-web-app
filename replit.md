# Overview

Teak Theory is a premium furniture e-commerce website built with React and Express.js. The application showcases sustainable teak furniture with a focus on craftsmanship and environmental responsibility. It features a modern, responsive design with a warm color palette that emphasizes the natural wood aesthetic. The site includes sections for featured categories, brand values, newsletter signup, and comprehensive navigation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing with support for single-page application navigation
- **Styling**: Tailwind CSS with custom design system featuring warm, earth-toned color variables for consistent branding
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds with hot module replacement

## Backend Architecture  
- **Framework**: Express.js with TypeScript for REST API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and migrations
- **Database Provider**: Neon Database (serverless PostgreSQL) for scalable cloud database hosting
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development and PostgreSQL for production
- **Development Server**: TSX for TypeScript execution in development with automatic restart capabilities

## Design System
- **Typography**: Multiple Google Fonts including Inter, Playfair Display, and Geist Mono for varied typography needs
- **Color Scheme**: Custom CSS variables supporting light/dark themes with warm, natural tones reflecting the teak wood aesthetic
- **Component Library**: Comprehensive UI component set including forms, navigation, dialogs, and data display components
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

## Development Workflow
- **Type Safety**: Shared TypeScript schemas between frontend and backend using Drizzle-Zod for validation
- **Database Management**: Drizzle Kit for schema migrations and database push operations
- **Development Tools**: Hot reloading, error overlays, and development banners for enhanced developer experience
- **Build Process**: Separate client and server builds with ESBuild for server bundling

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod resolvers for form validation
- **Backend**: Express.js with middleware for JSON parsing, URL encoding, and session management
- **Database**: Drizzle ORM with PostgreSQL dialect, Neon Database serverless driver

## UI and Styling
- **Component Library**: Radix UI primitives for accessible headless components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer for cross-browser compatibility
- **Icons**: Lucide React for consistent iconography
- **Utilities**: Class Variance Authority (CVA) for component variant management, clsx for conditional classes

## Development and Build Tools
- **Build Tools**: Vite with React plugin, ESBuild for server bundling
- **TypeScript**: Full TypeScript support with strict configuration
- **Development**: TSX for TypeScript execution, Replit-specific plugins for enhanced development experience
- **Database Tools**: Drizzle Kit for migrations and schema management

## Third-Party Services
- **Database Hosting**: Neon Database for serverless PostgreSQL hosting
- **Font Loading**: Google Fonts for typography (Inter, Playfair Display, Geist Mono)
- **Image Assets**: Unsplash for placeholder product and category images
- **Development Environment**: Replit-specific integrations for cartographer and error modals