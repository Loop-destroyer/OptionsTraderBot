# Iron Condor Trading Signals

## Overview

This is a modern web application built for NSE options trading, specifically focused on Iron Condor strategies with intelligent signal analysis. The application provides real-time market data, smart trading suggestions, and automated breakout analysis to help traders make informed decisions.

## System Architecture

### Full-Stack TypeScript Application
- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Build System**: Vite for frontend, esbuild for backend

### Monorepo Structure
The application follows a monorepo pattern with shared types and schemas:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Common TypeScript types and database schema

## Key Components

### Database Layer (Drizzle ORM + PostgreSQL)
- **Iron Condor Positions**: Stores active and historical iron condor trades
- **Options Chain**: Real-time options pricing data from NSE
- **Trading Signals**: Candlestick analysis and market sentiment
- **Smart Suggestions**: AI-generated trading recommendations
- **Market Data**: Live market status and pricing information

The database uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema is defined in `shared/schema.ts` with proper type inference throughout the application.

### Backend API Architecture
- **RESTful API**: Express.js with type-safe route handlers
- **NSE Integration**: Service layer for fetching live market data
- **Iron Condor Engine**: Complex calculations for options strategies
- **Storage Abstraction**: Interface-based storage layer for flexibility

### Frontend Architecture
- **Component-Based UI**: React with TypeScript and shadcn/ui components
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: TanStack Query for efficient data fetching
- **Trading Dashboard**: Single-page application with multiple data sections

### Trading Features
- **Real-time Options Chain**: Live pricing and volume data
- **Breakout Analysis**: 4-candle pattern recognition
- **Smart Suggestions**: Risk-reward optimized trade recommendations
- **P&L Visualization**: Interactive profit/loss charts
- **Position Management**: Active trade monitoring and trailing stops

## Data Flow

1. **Market Data Ingestion**: NSE API service fetches live options data
2. **Signal Processing**: Iron Condor engine analyzes candlestick patterns
3. **Database Storage**: All data persisted in PostgreSQL with Drizzle ORM
4. **API Layer**: Express.js serves data to frontend via REST endpoints
5. **Frontend Rendering**: React components display real-time trading interface
6. **User Interactions**: TanStack Query manages state and API calls

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and context
- **Express.js**: Backend web framework
- **TypeScript**: Type safety across the entire stack
- **PostgreSQL**: Production database via Neon serverless
- **Drizzle ORM**: Type-safe database operations

### UI/UX Dependencies
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible React component library
- **Radix UI**: Headless UI primitives
- **Lucide React**: Consistent icon library

### Data Management
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation
- **date-fns**: Date manipulation utilities

### Development Tools
- **Vite**: Fast frontend build tool
- **esbuild**: Fast backend bundling
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Replit-Optimized Deployment
- **Development**: `npm run dev` starts both frontend and backend
- **Production Build**: `npm run build` creates optimized bundles
- **Port Configuration**: Backend runs on port 5000, exposed as port 80
- **Database**: PostgreSQL 16 module in Replit environment

### Build Process
1. Frontend builds to `dist/public` via Vite
2. Backend bundles to `dist/index.js` via esbuild
3. Static files served by Express in production
4. Environment variables for database connection

### Environment Setup
- **NODE_ENV**: Development/production mode switching
- **DATABASE_URL**: PostgreSQL connection string
- **NSE_API_KEY**: Optional NSE data service authentication

## Recent Changes

- **June 22, 2025**: Enhanced capital management system
  - Added UserCapital schema with total/available/used capital tracking
  - Created CapitalManagement component with add/withdraw functionality
  - Built CustomStrategyForm for user-defined iron condor parameters
  - Integrated real-time P&L calculation with capital allocation
  - Added APK build instructions for Android deployment

## Changelog

- June 22, 2025: Initial setup
- June 22, 2025: Added capital management and custom strategy features

## User Preferences

Preferred communication style: Simple, everyday language.