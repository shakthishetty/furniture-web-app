# Overview

Teak Theory is a premium e-commerce platform specializing in sustainable teak furniture. It integrates a modern React frontend with an Express.js backend, featuring a comprehensive Manufacturing Tracking system across three distinct portals (Admin, Manufacturer, Customer). The platform emphasizes craftsmanship and environmental responsibility, offering a seamless shopping experience complemented by detailed manufacturing visibility and advanced product customization. Key capabilities include a robust discount management system and an automatic product status calculation based on stock and customization completeness.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side routing.
- **Styling**: Tailwind CSS with a custom design system featuring warm, earth-toned color variables.
- **UI Components**: Shadcn/ui component library built on Radix UI primitives.
- **State Management**: TanStack Query (React Query) for server state management.
- **Build Tool**: Vite for fast development and optimized production builds.

## Backend Architecture
- **Framework**: Express.js with TypeScript for REST API development.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **Development Server**: TSX for TypeScript execution with automatic restart.

## Design System
- **Typography**: Multiple Google Fonts (Inter, Playfair Display, Geist Mono).
- **Color Scheme**: Custom CSS variables supporting light/dark themes with warm, natural tones.
- **Component Library**: Comprehensive UI component set.
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities.

## Core Features & Implementations
- **Admin Authentication**: Separate admin login system with hardcoded credentials (furniture@gmail.com / password) that doesn't affect customer login flow. All admin routes are protected and redirect to /admin-login if not authenticated.
- **Manufacturer Notifications**: When an admin assigns a manufacturer to an order, the manufacturer receives a notification with the order number and product names.
- **Discount System**: Comprehensive CRUD operations for percentage and flat discounts, with validation rules (min order value, usage limits, validity periods) and checkout integration.
- **Automatic Product Status**: Calculates product availability (Active, Partial, Out of Stock, Draft) based on stock levels and customization setup completeness. Admin views include color-coded badges, progress bars, and missing setup indicators.
- **Manufacturing Tracking System**:
    - **Three Portals**: Admin, Manufacturer, and Customer with role-based access.
    - **Admin Portal**: Process management, manufacturer assignment, bulk operations, dashboard, advanced filtering, and real-time updates via SSE.
    - **Manufacturer Portal**: Dedicated interface for assigned processes, updates with photos, customer communication, real-time notifications, and enhanced product customization visualization (3D previews, material details).
    - **Customer Portal**: Real-time order tracking, timeline visualization, photo gallery, and direct communication with manufacturers.
- **Enhanced Product Customization Visualization**: Interactive 3D preview using Three.js with robust fallback chain (3D model → product image → placeholder). Displays detailed material options with visual enhancements (icons, color swatches) and dimensions summary.
- **Shared Component Library**: Reusable UI components (Timeline, UpdateCard, PhotoGrid, ReplyThread, ProductCustomizationDetail).
- **Security**: Role-based authentication and access control with separate admin authentication system.
- **Type Safety**: Full TypeScript integration across frontend and backend, with shared schemas using Drizzle-Zod.

# External Dependencies

- **Database Hosting**: Neon Database for serverless PostgreSQL.
- **Font Loading**: Google Fonts (Inter, Playfair Display, Geist Mono).
- **Image Assets**: Unsplash for placeholder content.
- **Icons**: Lucide React.
- **Component Primitives**: Radix UI.
- **Development Environment**: Replit-specific integrations.