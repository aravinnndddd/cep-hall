# CEP Hall

> **A modern, transparent, and role-based campus resource booking platform**

A web-based system to streamline and simplify campus resource booking for classes, workshops, meetings, and events with multi-level approval workflows and digital document generation.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Status: Active Development](https://img.shields.io/badge/Status-Active-brightgreen)
![Deployed: Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

**Live Demo:** https://cep-lab.vercel.app

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Development](#development)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CEP Hall is a resource management platform designed for educational institutions to digitize booking processes for campus facilities such as laboratories, seminar halls, and classrooms.

**Key Benefits:**

- ✅ **Reduces scheduling conflicts** with real-time availability
- ✅ **Transparent approval workflow** with multiple levels
- ✅ **Role-based access control** (users, HODs, staff, principals, admins)
- ✅ **Digital documentation** with PDF generation
- ✅ **Mobile responsive** design
- ✅ **SEO optimized** for better discoverability

The system replaces manual booking processes with a transparent, real-time, and role-based approval workflow.

---

## Features

### 👥 User Features

- ✨ **Browse Resources** - View all available labs, halls, and classrooms
- 📅 **Real-time Availability** - Check slot availability with interactive calendar
- 📝 **Create Bookings** - Request resources for single or multiple days
- 📊 **Track Status** - Monitor booking approval progress
- 📝 **Edit Requests** - Make corrections when requested
- ❌ **Cancel Bookings** - Withdraw requests if needed
- 📄 **Download Approvals** - Get PDF copy of approved bookings
- 📧 **Status Updates** - Receive updates at each approval stage

### 🔑 Approval Workflow

The system implements a transparent, multi-level approval process:

**For Labs:**

```
User Request → Staff Review → Principal Approval → Approved
```

**For Seminar Halls / Department Resources:**

```
User Request → HOD Review → Principal Approval → Approved
```

Each approver sees only requests relevant to their role and department.

### ⚙️ Admin Features

- 🏢 **Manage Resources** - Add, edit, delete campus facilities
- 👥 **Manage Approvers** - Configure approval hierarchy
- 📊 **View All Bookings** - System-wide booking dashboard
- 🔍 **Search & Filter** - Advanced booking search

### 📋 Roles & Permissions

| Role      | Permissions                                     |
| --------- | ----------------------------------------------- |
| User      | Create & manage personal bookings               |
| HOD       | Approve department resource requests            |
| Staff     | Approve lab bookings                            |
| Principal | Final approval authority                        |
| Admin     | Manage resources & approvers, system management |

---

## Tech Stack

### Frontend

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Firebase Auth** - Authentication
- **jsPDF** - PDF document generation
- **Lucide React** - Icon library

### Backend & Infrastructure

- **Firebase Authentication** - User auth (Google OAuth, Email)
- **Cloud Firestore** - NoSQL database
- **Vercel** - Hosting & deployment
- **Vite** - Build tool & dev server

### Developer Tools

- **TypeScript** - Static type checking
- **ESLint** - Code quality
- **Tailwind CSS** - Styling

---

## Architecture

### Authentication Flow

```
User Login
    ↓
Firebase Auth (Google OAuth / Email)
    ↓
Auth State Updated
    ↓
Fetch User Role from Firestore
    ↓
Check Admin Status
    ↓
Load Resources & Approvers
```

### Booking Approval Flow

```
User Creates Booking
    ↓
Set Status: waiting_hod / waiting_staff
    ↓
HOD/Staff Reviews & Approves
    ↓
Status: waiting_principal
    ↓
Principal Approves/Rejects
    ↓
Final Status: approved / rejected / correction_allowed
```

### Directory Structure

```
src/
├── components/        # Reusable React components
│   ├── Layout.tsx    - Main app layout wrapper
│   ├── Navbar.tsx    - Navigation component
│   ├── ProtectedAdminRoute.tsx  - Admin access guard
│   └── SeoManager.tsx - Dynamic SEO metadata
├── pages/            # Page-level components
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── BookingForm.tsx
│   ├── MyBookings.tsx
│   ├── CalendarView.tsx
│   ├── AdminPanel.tsx
│   ├── AdminResources.tsx
│   └── AdminApprovers.tsx
├── contexts/         # React Context providers
│   └── AuthContext.tsx - Global auth state
├── lib/             # Utility libraries
│   ├── firebase.ts   - Firebase config
│   └── utils.ts     - Helper functions
├── utils/           # Utility functions
│   └── pdfGenerator.ts - PDF generation
├── types.ts         # TypeScript definitions
├── App.tsx          # Root app component
└── main.tsx         # Entry point
```

---

## Installation

### Prerequisites

- **Node.js** 16+ and npm
- **Firebase Account** with Firestore enabled
- **Google OAuth credentials** for authentication

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/aravinnndddd/cep-hall.git
cd cep-hall
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env` file with Firebase config**

```bash
# .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these values from Firebase Console → Project Settings

4. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Development

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint

# Clean build artifacts
npm clean
```

### Firestore Setup

Create the following collections in Firebase Firestore:

**collections/resources**

```javascript
{
  id: "lab-1",
  name: "Lab A",
  type: "Lab",  // "Lab" | "Hall" | "Classroom"
  department: "CSE",
  capacity: 40
}
```

**collections/bookings**

```javascript
{
  userId: "user@college.edu",
  resourceId: "lab-1",
  resourceName: "Lab A",
  eventName: "Python Workshop",
  department: "CSE",
  date: "2024-03-25",
  startTime: "10:00",
  endTime: "12:00",
  participants: 30,
  purpose: "Course practical",
  equipment: "Projector",
  status: "approved",
  hodApproved: true,
  staffApproved: false,
  principalApproved: true,
  createdAt: Timestamp
}
```

**collections/authorizedApprovers**

```javascript
{
  email: "hod@college.edu",
  role: "hod",  // "hod" | "staff" | "principal"
  department: "CSE",
  isActive: true
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSuperAdmin() {
      return request.auth != null &&
             request.auth.token.email == "admin@college.edu";
    }

    match /authorizedApprovers/{email} {
      allow read: if request.auth != null;
      allow write: if isSuperAdmin();
    }

    match /resources/{doc} {
      allow read: if request.auth != null;
      allow write: if isSuperAdmin();
    }

    match /bookings/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Configuration

### Environment Variables

Update `.env` file in root directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Super Admin

Edit `src/contexts/AuthContext.tsx` to set super admin email:

```typescript
const SUPER_ADMIN = "admin@college.edu"; // Change this
```

---

## Contributing

We welcome contributions! CEP Hall is an open-source project and contributions help improve the platform.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Add comments and documentation
   - Follow the existing code style
   - Write clear commit messages
4. **Test your changes**
   ```bash
   npm run lint
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Create a Pull Request** with a clear description

### Code Style Guidelines

- Use **TypeScript** for all new files
- Add **JSDoc comments** for functions and components
- Use **Tailwind CSS** for styling (not inline styles)
- Keep components small and focused
- Write **meaningful variable names**
- Document complex logic with comments

### Reporting Issues

Found a bug? Have a suggestion?

1. Check existing [GitHub Issues](https://github.com/aravinnndddd/cep-hall/issues)
2. If not found, create a new issue with:
   - Clear title
   - Step-by-step reproduction
   - Expected vs actual behavior
   - Screenshots if applicable

### Development Standards

- **Code Review**: All PRs require review before merging
- **Testing**: Test changes locally before submitting
- **Documentation**: Update README/docs for new features
- **Commit Messages**: Use clear, descriptive messages

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy to Other Platforms

The app is a standard Vite + React application and can be deployed to:

- Netlify
- GitHub Pages (with routing config)
- Self-hosted servers
- Docker containers

Build command: `npm run build`
Output directory: `dist/`

---

## Database Structure

### 🏢 Resources Collection

Stores available labs, halls, and resources.

```typescript
interface Resource {
  id: string; // Firestore document ID
  name: string; // Display name
  type: "Lab" | "Hall"; // Resource type
  department: string; // Owning department
  capacity: number; // Max capacity
}
```

### 📅 Bookings Collection

Stores booking requests with approval metadata.

```typescript
interface Booking {
  id: string;
  userId: string;
  resourceId: string;
  eventName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participants: number;
  status: BookingStatus;
  hodApproved: boolean;
  staffApproved: boolean;
  principalApproved: boolean;
  createdAt: Timestamp;
  // ... more fields
}
```

### 👨‍💼 Authorized Approvers Collection

Stores roles and permissions for approvers.

```typescript
interface Approver {
  email: string;
  role: "hod" | "staff" | "principal";
  department?: string; // For HOD
  resourceId?: string; // For Staff
  isActive: boolean;
}
```

---

## Security Considerations

- ✅ Firebase Authentication required for all operations
- ✅ Role-based access control enforced
- ✅ Admin routes are protected
- ✅ Firestore rules restrict unauthorized access
- ⚠️ API keys are client-side (standard for Firebase)
- 📌 Super admin should be changed from default

---

## FAQ

**Q: How do I set up approvers?**
A: Add users to the `authorizedApprovers` collection in Firestore with their email, role, and department.

**Q: Can multiple people book the same resource?**
A: Yes, the system supports overlapping bookings for different time slots.

**Q: How are PDF letters generated?**
A: Using jsPDF library in `src/utils/pdfGenerator.ts`

**Q: Can I customize the approval workflow?**
A: Currently hardcoded to HOD/Staff → Principal. Modify `src/contexts/AuthContext.tsx` for changes.

---

## Future Enhancements

- 📧 Email notifications at approval stages
- 📱 Mobile app (React Native)
- 📊 Usage analytics dashboard
- 🔔 Push notifications
- 🌍 Multi-language support
- 📈 Booking analytics & reports
- 🔄 Integration with institutional calendar (Google Calendar, Outlook)

---

## License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

CEP Hall is developed for educational institutions. Modifications and redistribution are allowed under MIT terms.

---

## Support & Community

- 📧 **Email**: support@campushall.dev
- 💬 **GitHub Issues**: [Report bugs](https://github.com/aravinnndddd/campus-hall/issues)
- 🤝 **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- 📚 **Documentation**: Check the [wiki](https://github.com/aravinnndddd/campus-hall/wiki)

---

## Acknowledgments

- Developed for College of Engineering Perumon
- Built with React, Firebase, and Tailwind CSS
- Icons from Lucide React
- Animations powered by Framer Motion

---

**Made with ❤️ for educational institutions**
