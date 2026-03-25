# Campus Hall

A web-based system to streamline and simplify campus resource booking for classes, workshops, meetings, and events.

---

## Overview

Campus Hall is a resource management platform that allows students and staff to reserve campus facilities such as laboratories, seminar halls, classrooms, and other resources through an online interface.

The system replaces manual booking processes with a transparent, real-time, and role-based approval workflow.

---

## Features

### User

- View available resources
- Check real-time availability
- Book resources for single or multiple days
- Submit event details
- Track booking status
- Edit requests (if correction is allowed)
- Cancel or delete requests
- Download approved request letter (PDF)

---

### Approval Workflow

- **Labs** → Staff Approval → Principal Approval
- **Seminar Halls / Department Resources** → HOD Approval → Principal Approval

Each approver sees only the requests relevant to their role.

---

### Admin Panel

- Add new resources
- Edit resource details
- Update capacity or department
- Delete resources
- Manage all campus facilities dynamically

---

## Roles

| Role      | Access                      |
| --------- | --------------------------- |
| User      | Create and manage bookings  |
| HOD       | Approve department requests |
| Staff     | Approve lab requests        |
| Principal | Final approval              |
| Admin     | Manage resources            |

---

## Tech Stack

**Frontend**

- React
- TypeScript
- Tailwind CSS
- Framer Motion

**Backend**

- Firebase Authentication
- Cloud Firestore

**Utilities**

- jsPDF (PDF generation)
- date-fns

---

## Database Structure

### resources

- id
- name
- type (Lab / Hall / Classroom)
- department
- capacity

### bookings

- userId
- resourceId
- resourceName
- eventName
- department
- date / endDate
- startTime / endTime
- participants
- purpose
- equipment
- status
- approval metadata

### authorizedApprovers

- email
- role
- department or resourceId
- isActive

---

## Security

- Firebase Authentication required
- Role-based access control
- Protected admin routes
- Firestore rules for authenticated users

---

## Installation

1. Clone the repository

```
git clone https://github.com/your-username/cep-lab-booker.git
```

2. Install dependencies

```
npm install
```

3. Add Firebase configuration in:

```
src/lib/firebase.ts
```

4. Start the project

```
npm run dev
```

---

## Project Intent

To digitize and simplify campus resource booking, reduce scheduling conflicts, and improve transparency in the approval process.

---

## Future Improvements

- Email / WhatsApp notifications
- Calendar integration
- Usage analytics dashboard
- Mobile app version

---

## License

This project is developed for educational and institutional use.
