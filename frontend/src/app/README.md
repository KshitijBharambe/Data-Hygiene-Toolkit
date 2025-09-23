# Data Hygiene Tool - Frontend

A modern data quality management platform built with Next.js 15, featuring real-time monitoring, automated data validation, and comprehensive reporting capabilities.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Components**: Shadcn/ui + custom components
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── data/              # Data management pages
│   ├── rules/             # Rule management
│   ├── execution/         # Execution monitoring
│   ├── issues/            # Issue tracking
│   ├── reports/           # Reports and exports
│   └── admin/             # Admin panels
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn)
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard specific
│   ├── forms/            # Form components
│   └── providers/        # Context providers
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API client
│   ├── auth.ts          # Authentication config
│   └── utils.ts         # Utility functions
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## 🎨 Design System

### Colors
- **Primary**: Data quality theme colors
- **Success**: Clean data indicators
- **Warning**: Quality issues
- **Error**: Critical problems
- **Info**: General information

### Typography
- **Primary**: Inter (modern, readable)
- **Monospace**: JetBrains Mono (code, data)

### Components
All components follow consistent design patterns with proper accessibility, responsive design, and dark mode support.

## 🔧 Features

### Dashboard
- Real-time quality metrics
- Interactive charts and visualizations
- Recent activity timeline
- Quick action shortcuts

### Data Management
- Drag-and-drop file upload
- Dataset profiling and analysis
- Column-level statistics
- Data type inference

### Quality Rules
- Visual rule builder
- Multiple validation types
- Rule testing and preview
- Template library

### Execution Monitoring
- Real-time progress tracking
- Detailed execution logs
- Issue identification
- Performance metrics

### Issue Management
- Severity-based categorization
- Bulk resolution tools
- Fix tracking and audit
- Automated suggestions

### Reports & Analytics
- Quality trend analysis
- Custom report builder
- Multiple export formats
- Scheduled reporting

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication

The application uses NextAuth.js with credentials provider for authentication. Demo login is available with:
- Email: demo@datahygiene.com
- Password: demo123

## 📊 API Integration

The frontend connects to the FastAPI backend through a comprehensive API client that handles:
- Authentication tokens
- Request/response transformation
- Error handling and retries
- Automatic token refresh

## 🎯 User Roles

- **Admin**: Full system access, user management
- **Analyst**: Data analysis, rule creation, execution
- **Viewer**: Read-only access to reports and dashboards

## 🔧 Development

### Available Scripts
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint checks

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Husky for pre-commit hooks

## 📈 Performance

- Code splitting and lazy loading
- Optimized bundle size
- Image optimization
- React Query for efficient data fetching
- Responsive design for all devices

## 🔒 Security

- Secure authentication flow
- Role-based access control
- Input validation and sanitization
- XSS protection
- CSRF protection