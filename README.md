# FAQ App

A full-stack FAQ management web application built with the **MERN stack** (MongoDB, Express.js, React, Node.js). Users authenticate via **Google OAuth 2.0** or **Local Email/Password**, can post questions and answers, reply to existing FAQs, and admins have full control to edit or delete content.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Pages & Routes](#pages--routes)
- [Authentication Flow](#authentication-flow)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Contributing](#contributing)

---

## Features

- **Authentication** — Secure sign-in using Google accounts or local email and password.
- **JWT Authentication** — Stateless token-based auth stored in `localStorage`.
- **Post FAQs** — Authenticated users can submit questions with answers.
- **Reply to FAQs** — Users can add replies to any existing FAQ.
- **Admin Panel** — Admins can edit or delete any FAQ.
- **Role-Based Access** — `student` and `admin` roles with different permissions.
- **Public FAQ Browsing** — The home page is accessible without login.
- **Minimalist UI** — Clean, layout with dark/light mode toggle.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (Vite), React Router v6, Axios |
| Backend | Node.js, Express.js 5 |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Google OAuth 2.0 (Passport.js), bcryptjs, JWT (jsonwebtoken) |
| Styling | Vanilla CSS with modern, minimalist design tokens |

---

## Project Structure

```
FAQ_project/
├── backend/
│   ├── config/
│   │   └── passport.js        # Google OAuth strategy setup
│   ├── models/
│   │   ├── User.js            # User schema (googleId, name, email, password, role)
│   │   └── FAQ.js             # FAQ schema with embedded replies
│   ├── routes/
│   │   ├── auth.js            # /auth routes (Local login/register, Google OAuth, JWT, logout)
│   │   └── faq.js             # /faq routes (CRUD + replies)
│   ├── index.js               # Express app entry point
│   ├── package.json
│   └── .env                   # Environment variables (not committed)
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js          # Top navigation bar with theme toggle
    │   │   └── PrivateRoute.js    # Route guard for authenticated pages
    │   ├── pages/
    │   │   ├── Home.js            # Public FAQ listing
    │   │   ├── Login.js           # Local & Google sign-in page
    │   │   ├── AuthSuccess.js     # Handles token from OAuth callback
    │   │   ├── Dashboard.js       # User dashboard with navigation links
    │   │   ├── AddFAQ.js          # Form to submit a new FAQ
    │   │   ├── FAQReplies.js      # View FAQs and post replies
    │   │   └── AdminPanel.js      # Admin edit/delete interface
    │   ├── App.js                 # Root component, routing, auth state
    │   └── index.js               # React entry point
    └── package.json
```

---

## Database Models

### User

| Field | Type | Description |
|-------|------|-------------|
| `googleId` | String | Unique Google account ID (optional) |
| `name` | String | Display name |
| `email` | String | Email address |
| `password` | String | Hashed password for local auth (optional if using Google) |
| `role` | String | `student` (default) or `admin` |
| `createdAt` | Date | Account creation timestamp |

### FAQ

| Field | Type | Description |
|-------|------|-------------|
| `question` | String | The FAQ question |
| `answer` | String | The answer to the question |
| `createdBy` | String | Name of the user who posted it |
| `replies` | Array | Embedded array of reply objects |
| `createdAt` | Date | Creation timestamp |

**Reply (embedded in FAQ):**

| Field | Type | Description |
|-------|------|-------------|
| `text` | String | Reply content |
| `createdBy` | String | Name of the replying user |
| `createdAt` | Date | Reply timestamp |

---

## API Endpoints

### Auth Routes — `/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register a new user with email and password |
| POST | `/auth/login` | Public | Login with email and password |
| GET | `/auth/google` | Public | Initiates Google OAuth login |
| GET | `/auth/google/callback` | Public | OAuth callback; redirects with JWT |
| GET | `/auth/current-user` | Bearer Token | Returns current user from JWT |
| GET | `/auth/logout` | Public | Instructs frontend to clear token |

### FAQ Routes — `/faq`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/faq` | Public | Fetch all FAQs (newest first) |
| POST | `/faq/add` | Authenticated | Create a new FAQ |
| POST | `/faq/:id/reply` | Authenticated | Add a reply to a FAQ |
| PUT | `/faq/:id` | Admin only | Edit an existing FAQ |
| DELETE | `/faq/:id` | Admin only | Delete a FAQ |

---

## Pages & Routes

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | `Home` | Public | Browse all FAQs |
| `/login` | `Login` | Public | Local and Google sign-in |
| `/auth/success` | `AuthSuccess` | Public | Captures JWT from URL, redirects |
| `/dashboard` | `Dashboard` | Private | Navigation hub for the user |
| `/add-faq` | `AddFAQ` | Private | Form to submit a new FAQ |
| `/faq-replies` | `FAQReplies` | Private | View FAQs and post replies |
| `/admin` | `AdminPanel` | Private (Admin) | Edit/delete all FAQs |

> Private routes are protected by the `PrivateRoute` component, which redirects unauthenticated users to `/login`.

---

## Authentication Flow

### Local Authentication
1. User submits email and password to `POST /auth/login` (or `/auth/register`).
2. Server verifies credentials and returns a signed JWT.
3. Frontend saves JWT to `localStorage` and updates auth state.

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Browser navigates to `GET /auth/google`
3. Passport redirects to Google OAuth consent screen
4. Google redirects to `GET /auth/google/callback`
5. Passport verifies profile; finds or creates User in MongoDB
6. Server signs a JWT containing `{ id, name, email, role }`
7. Server redirects to: `http://localhost:3000/auth/success?token=<JWT>`
8. `AuthSuccess.js` reads token from URL, saves to `localStorage`

> For both methods, `App.js` reads the token on load and fetches `/auth/current-user` to hydrate state. All subsequent API calls send: `Authorization: Bearer <JWT>`.

---

## Role-Based Access Control

| Feature | Student | Admin |
|---------|---------|-------|
| Browse FAQs (Home) | Yes | Yes |
| Login with Google/Local | Yes | Yes |
| View Dashboard | Yes | Yes |
| Add a FAQ | Yes | Yes |
| Reply to a FAQ | Yes | Yes |
| Edit any FAQ | No | Yes |
| Delete any FAQ | No | Yes |
| Access Admin Panel | No | Yes |

> To make a user an admin, manually update their `role` field in MongoDB:
> ```js
> db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } })
> ```

---

## Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on port `27017`)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/patan-jamsheer/FAQ_project.git
cd FAQ_project
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file inside the `backend/` folder with the following:

```env
MONGO_URI=mongodb://localhost:27017/faqapp
SESSION_SECRET=mysecretkey123
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=myjwtsecretkey123
```

> **Note:** Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) must be obtained from [Google Cloud Console](https://console.cloud.google.com/). The **Authorized redirect URI** must be set to: `http://localhost:5000/auth/google/callback`

### Running the App

Open **two terminal windows**:

**Terminal 1 — Start the backend**

```bash
cd backend
npm start
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

**Terminal 2 — Start the frontend (Vite)**

```bash
cd frontend
npm start
```

Then open your browser and go to: `http://localhost:3000`

---

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request
