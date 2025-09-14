# Teak Theory - Premium Furniture E-commerce Platform

Teak Theory is a comprehensive furniture e-commerce website built with React and Express.js, featuring a sophisticated three-portal Manufacturing Tracking system. The platform showcases sustainable teak furniture with a focus on craftsmanship and environmental responsibility.

## 🌟 Key Features

### Three-Portal Manufacturing Tracking System
- **Admin Portal**: Complete process management and oversight
- **Manufacturer Portal**: Dedicated interface for manufacturing updates
- **Customer Portal**: Real-time order tracking and communication

### E-commerce Platform
- Modern, responsive design with warm color palette
- Product catalog with categories and search functionality
- Shopping cart and checkout system
- User authentication and account management
- Order management and tracking

## 🏗️ System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with hot module replacement

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Custom session-based authentication
- **Real-time**: Server-Sent Events (SSE) for live updates

### Design System
- **Typography**: Google Fonts (Inter, Playfair Display, Geist Mono)
- **Color Scheme**: Warm, natural tones reflecting teak wood aesthetic
- **Components**: Comprehensive UI library with accessibility features
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database access
- Environment variables configured

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see Environment Variables section)
4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🔧 Environment Variables

The following environment variables are available:

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual PostgreSQL connection parameters

### Object Storage
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` - Cloud storage bucket ID
- `PUBLIC_OBJECT_SEARCH_PATHS` - Paths for public assets
- `PRIVATE_OBJECT_DIR` - Directory for private objects

### Testing (Optional)
- `TESTING_STRIPE_SECRET_KEY` - Stripe test API key
- `TESTING_VITE_STRIPE_PUBLIC_KEY` - Stripe test public key

## 📱 Portal Access

### Admin Portal (`/admin`)
**Default Admin Credentials:**
- Email: `admin@teaktheory.com`
- Password: `admin123`

**Features:**
- Dashboard with real-time statistics
- User management
- Product and category management
- Order processing
- Manufacturing process oversight
- Analytics and reporting
- Discount management
- System settings

### Manufacturer Portal (`/manufacturer`)
**Features:**
- Process dashboard
- Assigned manufacturing processes
- Update posting with photo uploads
- Customer communication
- Real-time notifications
- Progress tracking

### Customer Portal
**Features:**
- Order tracking (`/orders/:orderId/tracking`)
- Manufacturing progress visibility
- Photo gallery of progress
- Direct communication with manufacturers
- Real-time status updates

## 🛒 E-commerce Features

### Customer Features
- Product browsing and search
- Category filtering
- Shopping cart management
- Secure checkout process
- Order history and tracking
- Wishlist functionality
- User account management

### Product Management
- Multi-category product organization
- High-quality product images
- Detailed product descriptions
- Pricing and inventory management
- 3D model support for products

## 🔄 Manufacturing Tracking System

### Process Flow
1. **Order Creation**: Customer places order through e-commerce platform
2. **Process Assignment**: Admin assigns manufacturing to specific manufacturers
3. **Progress Updates**: Manufacturers post updates with photos and status changes
4. **Customer Visibility**: Real-time tracking available to customers
5. **Communication**: Direct messaging between customers and manufacturers

### Real-time Features
- Live status updates via Server-Sent Events
- Instant notifications for all parties
- Real-time dashboard statistics
- Live process monitoring

## 🎨 UI Components

### Core Components
- **Navigation**: Multi-level navigation with category support
- **Forms**: Comprehensive form system with validation
- **Modals**: Accessible dialog system
- **Tables**: Data tables with sorting and filtering
- **Cards**: Product and information display cards
- **Buttons**: Various button styles and states

### Manufacturing Components
- **Timeline**: Visual progress tracking
- **UpdateCard**: Manufacturing update display
- **PhotoGrid**: Progress photo gallery
- **ReplyThread**: Communication threads

## 🗄️ Database Schema

### Core Entities
- **Users**: Customer and admin accounts
- **Products**: Product catalog with categories
- **Orders**: E-commerce orders and line items
- **Categories**: Product organization

### Manufacturing Entities
- **Processes**: Manufacturing process tracking
- **Stages**: Process stages and milestones
- **Updates**: Progress updates with photos
- **Replies**: Communication threads

## 📊 Analytics & Reporting

### Admin Analytics
- Revenue tracking
- Order statistics
- Manufacturing metrics
- User activity monitoring
- Performance dashboards

### Real-time Monitoring
- Live process status
- Active user sessions
- System health metrics
- Error tracking

## 🔒 Security Features

### Authentication
- Secure session management
- Role-based access control (Admin, Manufacturer, Customer)
- Password hashing with bcrypt
- Session timeout handling

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file upload handling

## 🧪 Testing

The application includes comprehensive testing capabilities:

### Test Data
- Default admin user for testing
- Sample products and categories
- Demo manufacturing processes

### Test Access
- Admin portal testing at `/admin`
- Manufacturer portal testing at `/manufacturer`
- Customer portal testing through order tracking

## 🚢 Deployment

### Production Deployment
- Database migrations handled by Drizzle
- Environment-specific configurations
- Asset optimization and bundling
- CDN integration for static assets

### Development Workflow
- Hot module replacement for fast development
- TypeScript type checking
- ESLint for code quality
- Automated testing capabilities

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Admin API
- `GET /api/admin/*` - Admin panel endpoints
- Product, user, order, and analytics management

### Manufacturing API
- `GET /api/manufacturing/*` - Manufacturing process endpoints
- Real-time updates and communication

### Public API
- `GET /api/products` - Product catalog
- `GET /api/categories` - Product categories
- `POST /api/orders` - Order creation

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use provided component library
- Maintain responsive design
- Write accessible code
- Follow naming conventions

### Code Structure
- Shared schemas in `shared/schema.ts`
- UI components in `client/src/components/`
- Pages in `client/src/pages/`
- API routes in `server/`
- Utilities in respective `lib/` directories

## 🆘 Support

### Access Points
- Admin portal available at `/admin` (footer link)
- Manufacturer portal available at `/manufacturer` (footer link)
- Customer support through order tracking system

### Troubleshooting
- Check browser console for client-side errors
- Monitor server logs for backend issues
- Verify database connections
- Ensure environment variables are set

## 📄 License

© 2024 Teak Theory. All rights reserved.

---

*This README covers the comprehensive Teak Theory e-commerce and manufacturing tracking platform. For specific implementation details, refer to the codebase documentation and inline comments.*