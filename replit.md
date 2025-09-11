# Overview

Teak Theory is a premium furniture e-commerce website built with React and Express.js featuring a comprehensive three-portal Manufacturing Tracking system. The application showcases sustainable teak furniture with a focus on craftsmanship and environmental responsibility, now enhanced with complete visibility into the custom furniture manufacturing process. It features a modern, responsive design with a warm color palette that emphasizes the natural wood aesthetic. The site includes sections for featured categories, brand values, newsletter signup, comprehensive navigation, and a complete manufacturing tracking system with separate interfaces for administrators, manufacturers, and customers.

# User Preferences

Preferred communication style: Simple, everyday language.

**UI Design Requirements**: All pages (existing and new) must follow the elegant green color scheme established on the homepage (#254127). Use design tokens consistently:
- Primary green: `text-primary`, `border-primary`, `hover:bg-primary/10`
- Text hierarchy: `text-foreground` (main text), `text-muted-foreground` (secondary text)
- Navigation: `text-muted-foreground` with `hover:text-primary` for inactive, `text-primary border-primary` for active
- Never use hardcoded black/gray colors (text-black, text-gray-*, border-black) - always use design tokens
- Maintain consistent styling across all user actions, typography, product cards, and page elements

# Manufacturing Tracking System (December 2025)

## Three-Portal Architecture
The system now features a comprehensive Manufacturing Tracking system with three separate portals:

### Admin Portal (/admin/manufacturing)
- **Process Management**: Create, assign, and monitor all manufacturing processes
- **Manufacturer Assignment**: Assign processes to specific manufacturer users
- **Bulk Operations**: Multi-select processes for efficient management
- **Dashboard Statistics**: Real-time overview of all manufacturing activity
- **Advanced Filtering**: Filter by status, manufacturer assignment, search by order ID
- **Comprehensive Details**: 3-tab interface (Timeline, Updates, Management)
- **Stage Management**: Add/edit manufacturing stages and update statuses
- **Real-time Updates**: Live SSE connection with status monitoring

### Manufacturer Portal (/manufacturer)
- **Dedicated Interface**: Separate portal for manufacturer users
- **Assigned Processes**: View only processes assigned to the current manufacturer
- **Process Updates**: Post updates with photos and status changes
- **Customer Communication**: Reply to customer questions and provide updates
- **Real-time Notifications**: Live updates for new assignments and customer messages
- **Dashboard Overview**: Statistics and processes needing attention
- **Mobile Responsive**: Full functionality on all devices

### Customer Portal (/orders/:orderId/tracking)
- **Order Tracking**: Real-time visibility into manufacturing progress
- **Timeline Visualization**: Clear progress indicators and stage status
- **Photo Gallery**: View manufacturing progress photos
- **Communication**: Ask questions and receive responses from manufacturers
- **Public Updates Only**: Internal manufacturer notes are filtered out
- **Real-time Updates**: Live notifications for manufacturing progress

## Key Features Implemented
- **Role-based Authentication**: Separate authentication for admin, manufacturer, and customer roles
- **Real-time Communication**: Server-Sent Events (SSE) for live updates across all portals
- **Comprehensive Security**: Role-based access control with strict data filtering
- **Shared Component Library**: Reusable UI components (Timeline, UpdateCard, PhotoGrid, ReplyThread)
- **Photo Upload System**: Object storage integration for manufacturing progress photos
- **Database Schema**: Complete manufacturing data model with processes, stages, updates, and replies
- **TypeScript Integration**: Full type safety across frontend and backend

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