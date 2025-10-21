
---

# **LeaveFlow: Modern Leave Management System**

![LeaveFlow Logo](https://via.placeholder.com/150x50?text=LeaveFlow)

**LeaveFlow** is a **SaaS-based HR tool** designed to **automate and simplify leave management** for organizations. It provides a **real-time, role-based dashboard** for admins and employees, with features like **leave requests, approval workflows, company holidays, team management, and real-time chat**.

---

## **📌 Table of Contents**
1. [Architecture Overview](#-architecture-overview)
2. [Key Features & Workflows](#-key-features--workflows)
3. [Tech Stack Deep Dive](#-tech-stack-deep-dive)
4. [Project Structure Explained](#-project-structure-explained)
5. [Database Design & Prisma ORM](#-database-design--prisma-orm)
6. [Authentication & Authorization Flow](#-authentication--authorization-flow)
7. [API Layer & Endpoints](#-api-layer--endpoints)
8. [Real-Time Features (Pusher)](#-real-time-features-pusher)
9. [Payment Integration (Stripe)](#-payment-integration-stripe)
10. [UI/UX & Component Library](#-uiux--component-library)
11. [Deployment & Scalability](#-deployment--scalability)
12. [Testing & Debugging](#-testing--debugging)
13. [Contribution Guidelines](#-contribution-guidelines)
14. [License & Legal](#-license--legal)

---

## **🏗 Architecture Overview**

LeaveFlow follows a **modern full-stack architecture** with:
- **Frontend**: Next.js (App Router) for SSR/SSG and React for UI.
- **Backend**: Next.js API routes for RESTful endpoints.
- **Database**: PostgreSQL with Prisma ORM for type-safe queries.
- **Real-Time**: Pusher for chat and notifications.
- **Auth**: NextAuth.js for Google OAuth and session management.
- **Payments**: Stripe for subscriptions and one-time payments.

### **High-Level Architecture Diagram**
```
┌───────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
└───────────────┬───────────────────┬───────────────────────────┘
                │                   │
┌───────────────▼───────┐   ┌───────▼───────────────────────────┐
│      Next.js Frontend  │   │       Next.js API (Backend)        │
│  - React Components   │   │  - REST Endpoints                 │
│  - Tailwind CSS       │   │  - Prisma ORM                     │
│  - ShadCN UI          │   │  - Stripe/Pusher Integrations     │
└───────────────┬───────┘   └──────────────┬────────────────────────┘
                │                          │
┌───────────────▼──────────────────────────▼───────────────────┐
│                     PostgreSQL Database                      │
│  - Users, Companies, TimeOffRequests, ChatMessages, etc.    │
└───────────────────────────────────────────────────────────────┘
```

---

## **✨ Key Features & Workflows**

### **1. Role-Based Dashboards**
- **Admin Dashboard**:
  - View **pending/approved leave requests**.
  - Manage **employees, company holidays, and working days**.
  - Generate **reports** and **invitation codes**.
  - **Real-time chat** with employees.
- **Employee Dashboard**:
  - Submit **leave requests**.
  - View **personal leave history** and **company holidays**.
  - **Chat with admins/colleagues**.

### **2. Leave Request Workflow**
1. **Employee submits a request** (with start/end dates, type, and reason).
2. **Admin reviews** the request in the dashboard.
3. **Admin approves/rejects** the request.
4. **System updates** the employee’s available leave balance.
5. **Employee is notified** via real-time chat or email (future feature).

### **3. Real-Time Chat**
- Built with **Pusher** for instant messaging.
- Supports **1:1 and group chats**.
- **Typing indicators** and **read receipts**.

### **4. Company Settings**
- Configure **working days** (e.g., Mon-Fri).
- Add **company holidays** (one-time or recurring).
- Update **company profile** (logo, name, website).

### **5. Subscription & Payments**
- **Stripe integration** for:
  - One-time payments (7-day, 14-day, 1-month plans).
  - Recurring subscriptions (future).
- **Webhook handling** for payment success/failure.

### **6. Reports & Analytics**
- Filter leave requests by **date, employee, or status**.
- Export reports as **PDF/Excel**.

---

## **🛠 Tech Stack Deep Dive**

| Category          | Technology               | Purpose                                                                 |
|--------------------|--------------------------|-------------------------------------------------------------------------|
| **Frontend**       | Next.js (App Router)      | SSR, SSG, and React for dynamic UI.                                    |
| **Styling**        | Tailwind CSS + ShadCN     | Utility-first CSS and pre-built components.                          |
| **State Management**| React Query + Zustand    | Data fetching, caching, and global state.                             |
| **Backend**        | Next.js API Routes       | RESTful endpoints for frontend-backend communication.                  |
| **Database**       | PostgreSQL + Prisma      | Relational database with type-safe ORM.                               |
| **Auth**           | NextAuth.js              | Google OAuth, session management, and role-based access.             |
| **Real-Time**      | Pusher                   | Chat, notifications, and live updates.                                 |
| **Payments**       | Stripe                   | Subscriptions, one-time payments, and webhooks.                       |
| **Animations**     | Framer Motion            | Smooth UI transitions and micro-interactions.                        |
| **Forms**          | React Hook Form + Zod    | Type-safe form validation and submission.                            |
| **Testing**        | Jest + React Testing Lib | Unit and integration testing (WIP).                                    |
| **Deployment**     | Vercel/Docker            | Serverless deployment and containerization.                           |

---

## **📂 Project Structure Explained**

```bash
sajid-tech-saas-resources-tool/
├── app/
│   ├── (dashboard)/      # Authenticated routes (Admin/Employee)
│   │   ├── admin/        # Admin-specific pages (e.g., time-off requests, reports)
│   │   └── employee/     # Employee-specific pages (e.g., leave requests, calendar)
│   ├── (public)/         # Public landing pages (marketing, FAQ)
│   ├── api/              # API routes (REST endpoints)
│   │   ├── admin/        # Admin APIs (e.g., approve requests, manage employees)
│   │   └── employee/     # Employee APIs (e.g., submit requests)
│   └── auth/             # Authentication pages (sign-in, success)
├── components/           # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components (e.g., tables, forms)
│   ├── landing/          # Landing page components (e.g., hero section, FAQ)
│   └── ui/               # ShadCN UI components (e.g., buttons, cards)
├── hooks/                # Custom React hooks (e.g., useChat, usePusher)
├── lib/                  # Utility functions and configs
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client setup
│   └── pusher.ts         # Pusher client setup
├── prisma/               # Prisma schema and migrations
└── types/                # TypeScript types (e.g., ChatRoom, User)
```

### **Key Directories Explained**
1. **`app/(dashboard)/`**:
   - Contains **role-specific layouts** (`admin`, `employee`).
   - Uses **middleware** to enforce authentication and role-based access.
2. **`app/api/`**:
   - **RESTful endpoints** for frontend-backend communication.
   - **Admin APIs**: Manage employees, requests, and company settings.
   - **Employee APIs**: Submit requests, fetch personal data.
3. **`components/dashboard/`**:
   - **Admin components**: `admin-calendar.tsx`, `time-off-request-table.tsx`.
   - **Employee components**: `employee-calendar.tsx`, `request-table.tsx`.
4. **`lib/`**:
   - **`auth.ts`**: NextAuth configuration (Google OAuth).
   - **`prisma.ts`**: Prisma client singleton for database access.
   - **`pusher.ts`**: Pusher client for real-time features.

---

## **🗃 Database Design & Prisma ORM**

### **Core Models**
1. **User**:
   - Stores **employee/admin profiles**.
   - Fields: `id`, `email`, `role`, `companyId`, `availableDays`.
2. **Company**:
   - Stores **company details** (name, logo, working days).
   - Fields: `id`, `name`, `workingDays`, `holidays`.
3. **TimeOffRequest**:
   - Tracks **leave requests**.
   - Fields: `id`, `employeeId`, `startDate`, `endDate`, `status`.
4. **ChatRoom** & **ChatMessage**:
   - Powers **real-time chat**.
   - Fields: `id`, `participants`, `messages`.
5. **Subscription**:
   - Manages **Stripe subscriptions**.
   - Fields: `userId`, `stripeCustomerId`, `planType`, `status`.

### **Example Prisma Query**
```ts
// Fetch all pending leave requests for a company
const pendingRequests = await prisma.timeOffRequest.findMany({
  where: {
    employee: { companyId: "company_123" },
    status: "PENDING",
  },
  include: { employee: true },
});
```

---

## **🔐 Authentication & Authorization Flow**

### **1. Sign-In Flow**
1. User clicks **"Sign in with Google"** on `/auth/signin`.
2. NextAuth redirects to Google OAuth.
3. On success, NextAuth creates a **session** and redirects to `/auth/success`.
4. Middleware checks `session.user.role` and redirects to `/admin` or `/employee`.

### **2. Role-Based Access**
- **Middleware** (`middleware.ts`) enforces role-based routing:
  ```ts
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  ```
- **API routes** also check roles:
  ```ts
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  ```

### **3. Session Management**
- **JWT-based sessions** stored in HTTP-only cookies.
- **Session data** includes:
  ```ts
  {
    user: {
      id: string,
      email: string,
      role: "ADMIN" | "EMPLOYEE",
      onboardingCompleted: boolean,
    }
  }
  ```

---

## **📡 API Layer & Endpoints**

### **Admin APIs**
| Endpoint                          | Method | Description                                  |
|-----------------------------------|--------|----------------------------------------------|
| `/api/admin/dashboard`            | GET    | Fetch dashboard stats (pending requests, etc.). |
| `/api/admin/employees`           | GET    | List all employees.                          |
| `/api/admin/time-off-requests/[id]` | PUT  | Approve/reject a leave request.              |
| `/api/admin/holidays`            | POST   | Add a company holiday.                       |
| `/api/admin/working-days`        | PUT    | Update company working days.                |

### **Employee APIs**
| Endpoint                          | Method | Description                                  |
|-----------------------------------|--------|----------------------------------------------|
| `/api/employee/time-off-requests`| POST   | Submit a new leave request.                 |
| `/api/employee/colleagues`       | GET    | Fetch colleagues for chat.                  |

### **Auth APIs**
| Endpoint                          | Method | Description                                  |
|-----------------------------------|--------|----------------------------------------------|
| `/api/auth/[...nextauth]`         | GET/POST | NextAuth.js authentication routes.         |
| `/api/auth/current-user`         | GET    | Fetch current user data.                    |

### **Real-Time APIs**
| Endpoint                          | Method | Description                                  |
|-----------------------------------|--------|----------------------------------------------|
| `/api/chat`                      | GET/POST | Fetch/create chat rooms.                   |
| `/api/chat/[roomId]/messages`    | GET/POST | Fetch/send messages in a room.            |

---

## **💬 Real-Time Features (Pusher)**

### **How It Works**
1. **Frontend subscribes** to Pusher channels:
   ```ts
   pusherClient.subscribe(`chat-${roomId}`);
   ```
2. **Backend triggers events** on actions (e.g., new message):
   ```ts
   await pusherServer.trigger(`chat-${roomId}`, 'new-message', messageData);
   ```
3. **Frontend listens** for events and updates UI:
   ```ts
   channel.bind('new-message', (data) => {
     setMessages([...messages, data]);
   });
   ```

### **Key Channels**
- `chat-{roomId}`: Room-specific messages.
- `user-{userId}`: User-specific notifications (e.g., new chat room).
- `company-{companyId}`: Company-wide updates (e.g., new holiday).

---

## **💳 Payment Integration (Stripe)**

### **Workflow**
1. **Admin selects a plan** (7-day, 14-day, 1-month).
2. **Frontend calls** `/api/admin/create-checkout-session` with `planId`.
3. **Backend creates a Stripe Checkout Session**:
   ```ts
   const checkoutSession = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [{ price: priceIds[planId], quantity: 1 }],
     success_url: `${APP_URL}/admin/success?session_id={CHECKOUT_SESSION_ID}`,
   });
   ```
4. **User is redirected** to Stripe Checkout.
5. **Stripe webhook** (`/api/admin/webhooks`) updates the database on success.

### **Webhook Events**
- `checkout.session.completed`: Extend/activate subscription.
- `customer.subscription.updated`: Update subscription status.
- `customer.subscription.deleted`: Mark subscription as canceled.

---

## **🎨 UI/UX & Component Library**

### **Key UI Libraries**
1. **ShadCN UI**:
   - Pre-built, accessible components (e.g., `Button`, `Card`, `Table`).
   - Customized for LeaveFlow’s branding.
2. **Tailwind CSS**:
   - Utility-first styling for rapid development.
3. **Framer Motion**:
   - Animations for modals, dropdowns, and transitions.

### **Example Component: `StatCard`**
```tsx
const StatCard = ({ title, value, icon: Icon, color, description }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-purple-200 p-3">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
);
```

---

## **🚀 Deployment & Scalability**

### **Vercel (Recommended)**
1. **Push to GitHub**.
2. **Import into Vercel**.
3. **Add environment variables** in Vercel’s dashboard.
4. **Deploy** (automatic CI/CD).

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### **Scalability Considerations**
- **Database**: Use **PostgreSQL read replicas** for heavy read operations.
- **Real-Time**: Pusher scales automatically with usage.
- **Caching**: Implement **Redis** for frequent queries (e.g., dashboard stats).

---

## **🧪 Testing & Debugging**

### **Testing Strategy**
1. **Unit Tests**: Jest for individual functions/components.
2. **Integration Tests**: React Testing Library for component interactions.
3. **E2E Tests**: Cypress for user flows (WIP).

### **Debugging Tips**
- **Prisma Studio**: Visualize database data.
  ```bash
  npx prisma studio
  ```
- **Stripe CLI**: Test webhooks locally.
  ```bash
  stripe listen --forward-to localhost:3000/api/admin/webhooks
  ```
- **Pusher Debug Console**: Monitor real-time events.

---

## **🤝 Contribution Guidelines**

1. **Fork the repository**.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a Pull Request**.

### **Code Standards**
- **TypeScript**: Strict typing for all functions/components.
- **ESLint/Prettier**: Follow existing code style.
- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/).

---

## **📜 License & Legal**

This project is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.

### **Third-Party Dependencies**
| Dependency       | License       | Purpose                     |
|------------------|----------------|-----------------------------|
| Next.js          | MIT            | Frontend framework          |
| Prisma           | Apache 2.0     | Database ORM                |
| Stripe           | MIT            | Payments                    |
| Pusher           | MIT            | Real-time features          |
| Tailwind CSS     | MIT            | Styling                     |
| ShadCN UI        | MIT            | UI components               |

---

## **💬 Support & Contact**

For questions, bug reports, or feature requests:
- **Email**: [sajidhussain189057@gmail.com](mailto:sajidhussain189057@gmail.com)
- **GitHub Issues**: [sajid-tech/leaveflow/issues](https://github.com/Mansarah/saas-resources-tool/issues)

---

**LeaveFlow** is built with ❤️ to **simplify HR workflows** for teams of all sizes. Star ⭐ the repo if you find it useful, and contribute to make it even better!