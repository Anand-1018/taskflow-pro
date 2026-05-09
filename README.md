# TaskFlow Pro 🚀

A full-stack Task Management System built with React.js, Node.js, Express.js, and MongoDB. Designed to help teams manage projects, track tasks, and collaborate effectively.

---

## 🎯 Features

- **JWT Authentication** — Secure login & registration with token-based sessions
- **Role-Based Access Control** — Admin & Team Member roles with different permissions
- **Project Management** — Create, edit, delete projects with status tracking
- **Task Management** — Full CRUD with priority levels and status updates
- **Comments System** — Add comments to any task for collaboration
- **Dashboard Analytics** — Visual stats, task overview charts, recent activity
- **Responsive Design** — Works seamlessly on desktop and mobile

---

## 🛠️ Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React.js, Vite, Tailwind CSS  |
| HTTP Client| Axios                         |
| Routing    | React Router DOM v6           |
| State      | Context API                   |
| Backend    | Node.js, Express.js           |
| Database   | MongoDB, Mongoose             |
| Auth       | JWT, bcryptjs                 |
| Validation | express-validator             |

---

## 📁 Project Structure

```
taskflow-pro/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/        # Reusable UI (Modal, etc.)
│   │   ├── context/           # AuthContext (global auth state)
│   │   ├── layouts/           # DashboardLayout (sidebar)
│   │   ├── pages/             # LoginPage, Dashboard, Projects, Tasks, Users
│   │   ├── services/          # Axios API instance
│   │   ├── App.jsx            # Routes configuration
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/
    ├── controllers/           # Business logic
    ├── middleware/            # Auth + error handling
    ├── models/                # Mongoose schemas
    ├── routes/                # Express routes
    └── server.js              # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint             | Access  | Description      |
|--------|---------------------|---------|------------------|
| POST   | /api/auth/register  | Public  | Register user    |
| POST   | /api/auth/login     | Public  | Login user       |
| GET    | /api/auth/profile   | Private | Get own profile  |

### Projects
| Method | Endpoint           | Access       |
|--------|--------------------|--------------|
| GET    | /api/projects      | Private      |
| POST   | /api/projects      | Admin only   |
| PUT    | /api/projects/:id  | Admin only   |
| DELETE | /api/projects/:id  | Admin only   |

### Tasks
| Method | Endpoint          | Access       |
|--------|-------------------|--------------|
| GET    | /api/tasks        | Private      |
| GET    | /api/tasks/stats  | Private      |
| POST   | /api/tasks        | Admin only   |
| PUT    | /api/tasks/:id    | Private      |
| DELETE | /api/tasks/:id    | Admin only   |

### Comments
| Method | Endpoint               | Access  |
|--------|------------------------|---------|
| GET    | /api/comments/:taskId  | Private |
| POST   | /api/comments          | Private |

---

## 🗃️ Database Schema

### User
```
name, email (unique), password (hashed), role (admin/member), timestamps
```

### Project
```
title, description, status, dueDate, createdBy (ref:User), members [ref:User], timestamps
```

### Task
```
title, description, status, priority, dueDate, project (ref:Project), assignedTo (ref:User), createdBy (ref:User), timestamps
```

### Comment
```
text, task (ref:Task), createdBy (ref:User), timestamps
```

---

## ☁️ Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel
3. Set `VITE_API_URL` environment variable to your backend URL
4. Deploy

### Backend → Render
1. Push `backend/` to GitHub
2. Create new Web Service on Render
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`
4. Deploy

---

## 👤 Demo Credentials
```
Admin:  admin@taskflow.com  / admin123
Member: member@taskflow.com / member123
```

---

## 🔮 Future Improvements
- Email notifications for task assignments
- File attachments on tasks
- Team chat / real-time updates (Socket.io)
- Calendar view for task deadlines
- Export reports as PDF/Excel
- Dark mode support
- Activity logs and audit trail

---

## 👨‍💻 Author

Built as a full-stack assessment project demonstrating:
- REST API design
- JWT Authentication & RBAC
- MongoDB data modeling
- React + Context API
- Responsive UI with Tailwind CSS

---

*TaskFlow Pro — Simple, clean, and effective task management.*
