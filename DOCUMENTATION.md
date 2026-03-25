# CEP Hall - Documentation Index

Complete guide to all documentation and resources for the CEP Hall project.

## 📚 Main Documentation

### Getting Started

- **[README.md](README.md)** - Project overview, features, tech stack, installation guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute, code style, development setup
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community standards and expectations
- **[SECURITY.md](SECURITY.md)** - Security policies and best practices
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

## 🏗️ Architecture & Technical

### Project Structure

```
src/
├── App.tsx                 # Main app routing and layout
├── main.tsx               # Application entry point
├── types.ts               # TypeScript type definitions
├── components/            # Reusable React components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Navbar.tsx         # Navigation bar
│   ├── ProtectedAdminRoute.tsx  # Admin access guard
│   └── SeoManager.tsx      # Dynamic SEO metadata
├── pages/                 # Page-level components
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── BookingForm.tsx
│   ├── MyBookings.tsx
│   ├── CalendarView.tsx
│   ├── AdminPanel.tsx
│   ├── AdminResources.tsx
│   └── AdminApprovers.tsx
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Global authentication state
├── lib/                   # Core libraries
│   ├── firebase.ts        # Firebase initialization
│   └── utils.ts           # Helper utilities
├── utils/                 # Utility functions
│   └── pdfGenerator.ts    # PDF generation
└── index.css             # Global styles

public/
├── favicon.png           # Site favicon
├── logo.png              # Logo image
├── robots.txt            # Search engine crawling rules
└── sitemap.xml           # XML sitemap for SEO
```

### Key Files with Documentation

#### Core Infrastructure

- **[src/main.tsx](src/main.tsx)** - React app initialization
  - Entry point for the application
  - Mounts app to DOM root element
  - Initializes React StrictMode

- **[src/App.tsx](src/App.tsx)** - Main router configuration
  - Defines all application routes
  - Sets up providers: AuthProvider, Toaster, SeoManager
  - Protected routes with ProtectedAdminRoute

- **[src/types.ts](src/types.ts)** - Type definitions
  - `BookingStatus` - Booking workflow states
  - `Resource` - Lab/Hall resource interface
  - `Booking` - Complete booking request structure
  - `Approver` - User approval roles

#### Authentication

- **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)** - Global auth state
  - User authentication management
  - Role-based access control (RBAC)
  - Resource and approver data fetching
  - `useAuth()` hook for components

#### Configuration

- **[src/lib/firebase.ts](src/lib/firebase.ts)** - Firebase setup
  - Firebase authentication initialization
  - Firestore database connection
  - Google OAuth provider configuration
  - Environment variable validation

- **[vite.config.ts](vite.config.ts)** - Vite build configuration
  - React and Tailwind CSS plugins
  - Path aliases (@)
  - Development server settings

- **[tsconfig.json](tsconfig.json)** - TypeScript configuration
  - Strict type checking
  - Module resolution settings
  - Compiler options

## 🚀 Development Guides

### [Local Development Setup](README.md#installation)

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` with Firebase config
4. Start dev server: `npm run dev`
5. Access at `http://localhost:3000`

### [Building for Production](README.md#development)

```bash
npm run build     # Build optimized bundle
npm run preview   # Preview production build locally
```

### [Contributing Code](CONTRIBUTING.md)

- **Code Style**: TypeScript, ESLint, Tailwind CSS
- **Comments**: JSDoc for functions, inline comments for logic
- **Commits**: Semantic commit messages with clear descriptions
- **Pull Requests**: Include description, testing notes, screenshots

### [Firestore Database Setup](README.md#firestore-setup)

Collections to create:

- `resources` - Available labs, halls, classrooms
- `bookings` - Booking requests with approval data
- `authorizedApprovers` - User roles and permissions

## 📖 How-To Guides

### Adding a New Page

1. Create component in `src/pages/`
2. Add JSDoc comments describing purpose
3. Add route in `src/App.tsx`
4. Update SEO metadata in `src/components/SeoManager.tsx` (if public)
5. Run `npm run lint` to validate TypeScript

### Adding Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAdmin } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.email}</div>;
};
```

### Creating a New Type

1. Add to `src/types.ts` with JSDoc
2. Use in components/utilities
3. Run `npm run lint` to validate

### Generating PDFs

```typescript
import { generateRequestLetter } from "@/utils/pdfGenerator";

const booking = {
  /* booking data */
};
await generateRequestLetter(booking);
```

## 🔐 Security Resources

### [Security Policy](SECURITY.md)

- Reporting vulnerabilities
- Firebase security best practices
- Firestore security rules
- Deployment security checklist

## 🤝 Community & Support

- **GitHub Issues**: [Report bugs, request features](https://github.com/your-org/campus-hall/issues)
- **Discussions**: [Ask questions, share ideas](https://github.com/your-org/campus-hall/discussions)
- **Email**: support@campushall.dev
- **Security**: security@campushall.dev

## 📊 Project Stats

- **Languages**: TypeScript, React, CSS (Tailwind)
- **Backend**: Firebase (Auth + Firestore)
- **Hosting**: Vercel
- **License**: MIT
- **Demo**: https://campushall.vercel.app

## 🔗 External Resources

### Technology Documentation

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Framer Motion Guide](https://www.framer.com/motion/)

### Best Practices

- [Clean Code in JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 📝 Documentation Standards

All code should follow these documentation standards:

### File Headers

```typescript
/**
 * @file fileName.ts
 * @description What this file does
 */
```

### Functions/Components

```typescript
/**
 * What this function does
 *
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 *
 * @example
 * myFunction(param);
 */
function myFunction(param: Type): Type {
  // Implementation
}
```

### Complex Logic

```typescript
// Fetch user's approval role from Firestore
const approverDoc = await getDoc(doc(db, "authorizedApprovers", email));
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase connection errors** → Check .env variables match Firebase project
2. **TypeScript errors** → Run `npm run lint` to identify issues
3. **Styling issues** → Check Tailwind CSS class names are correct
4. **Authentication fails** → Verify Firebase config and Google OAuth setup

For more help, see [SECURITY.md](SECURITY.md) or create an GitHub issue.

---

**For quick setup**: Start with [README.md](README.md)  
**For contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)  
**For questions**: Check existing [GitHub Issues](https://github.com/your-org/campus-hall/issues)
