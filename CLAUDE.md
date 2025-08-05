# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack for faster builds
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Firebase Setup
- `npx tsx scripts/setupFirebase.ts` - Seed Firebase with initial data (requires environment variables)
- Ensure `.env.local` contains all required Firebase configuration variables

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.5 with App Router (React 19)
- **Database**: Firebase Firestore with real-time capabilities
- **Authentication**: Firebase Auth with role-based access (cooker/customer/driver/admin)
- **Styling**: Tailwind CSS 4 with CSS variables and custom LicanÑam brand colors
- **UI Components**: Shadcn/ui with Radix UI primitives and Lucide icons
- **Animations**: Framer Motion and Tailwind Animate
- **Image Handling**: Next.js Image with Unsplash domains configured

### App Structure
The application uses Next.js App Router with role-based routing:

- `/admin` - Admin dashboard for platform management
- `/client/home` - Customer home page with dish browsing
- `/cooker/dashboard` - Cook management interface for orders/dishes
- `/driver/dashboard` - Delivery driver order management  
- `/dishes/[id]` - Individual dish pages with recommendations
- `/cooks/[id]` - Cook profile pages
- `/cart` - Shopping cart functionality
- `/login` - Authentication page

### Key Architectural Patterns

**Firebase Integration**:
- Client-side Firebase config in `lib/firebase/client`
- Server-side Firebase Admin in API routes
- Real-time Firestore listeners for live updates
- Structured security rules in `firestore.rules` with role-based permissions

**Authentication System**:
- `AuthContext` provides user state and role management across the app
- Role-based routing and component rendering
- Session management with HTTP-only cookies via API routes

**Component Organization**:
- `components/ui/` - Reusable Shadcn/ui components
- Custom components follow Tailwind + CSS variables pattern
- Brand colors: `atacama-orange` (#F57C00) and `atacama-beige` (#D7CCC8)

**Data Models**:
- Users have roles: customer, cooker, driver, admin
- Cooks create and manage dishes
- Orders flow: pending → accepted → preparing → ready → delivering → delivered
- Real-time updates for order status changes

### Firebase Collections Structure
- `users/{userId}` - User profiles with role information
- `cooks/{cookId}` - Cook profiles and business info
- `dishes/{dishId}` - Food items with cook association
- `orders/{orderId}` - Order tracking with status management
- `reviews/{reviewId}` - Customer reviews and ratings
- `carts/{userId}` - User shopping cart data
- `favorites/{userId}` - User favorite dishes/cooks

### Development Workflow

1. **Environment Setup**: Copy Firebase config variables to `.env.local`
2. **Firebase Rules**: Deploy `firestore.rules` to Firebase Console before testing
3. **Data Seeding**: Run setup script to populate initial test data
4. **Development**: Use `npm run dev` with Turbopack for fast iteration
5. **Testing**: Verify role-based access and real-time updates work correctly

### Important Notes

- Firestore security rules enforce user-based data access
- All authenticated routes require proper role verification
- Image optimization configured for Unsplash domains
- CSS variables enable theme consistency across components
- Real-time subscriptions should be properly cleaned up in useEffect

### Color Theme Implementation

**Safe Color Usage Pattern**:
The app uses a dual color system for stability:
- Atacama Desert palette (with `atacama-` prefix): 
  - `atacama-orange`: #F57C00 (sunset orange)
  - `atacama-brown`: #8D6E63 (earth brown)
  - `atacama-beige`: #D7CCC8 (sand beige)
  - `atacama-olive`: #556B2F (olive green)

**Important**: When adding new theme colors:
1. Always use different prefixes to avoid conflicts
2. Test incrementally - apply to one component at a time
3. Keep original colors as fallback
4. Avoid massive simultaneous font and color changes (causes Turbopack errors)