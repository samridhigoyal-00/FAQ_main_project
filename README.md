Crowd-Sourced FAQ Platform

Overview

The Crowd-Sourced FAQ Platform is a full-stack web application developed using the MERN stack (MongoDB, Express.js, React.js, and Node.js). The platform provides a centralized environment where users can create, browse, and discuss frequently asked questions while ensuring secure access through authentication and role-based authorization.
The application aims to streamline knowledge sharing by allowing community members to contribute and access verified information through a structured FAQ system.

Problem Statement

Students and communities frequently encounter recurring questions related to academics, internships, placements, technical topics, and campus activities. These answers are often scattered across multiple communication channels, making information difficult to locate and maintain.
This project addresses that challenge by providing a centralized platform that enables users to create, discover, and contribute to a growing repository of frequently asked questions.

Objectives

Create a centralized repository of community-driven FAQs.
Enable collaborative knowledge sharing.
Implement secure authentication and authorization mechanisms.
Provide administrative controls for content moderation.
Maintain a scalable and maintainable system architecture.
Improve accessibility and discoverability of information.

Key Features

Authentication and Authorization
Google OAuth 2.0 authentication
JWT-based authorization
Protected routes for authenticated users
Role-based access control

FAQ Management

Create new FAQs
View existing FAQs
Reply to FAQ discussions
Public access to FAQ content

Administrative Features

Edit FAQ entries
Delete FAQ entries
Moderate platform content
Manage user permissions

User Experience

Responsive user interface
Dashboard-based navigation
Structured discussion threads
Intuitive workflow

Technology Stack

Layer                        Technology
Frontend                     React.js, React Router, Axios
Backend                      Node.js, Express.js
Database                     MongoDB, Mongoose
Authentication               Google OAuth 2.0, Passport.js
Authorization                JSON Web Tokens (JWT)
Version Control              Git, GitHub


System Architecture

The application follows a layered architecture to ensure separation of concerns and maintainability.

Client (React Frontend)
           │
           ▼
      API Routes
           │
           ▼
     Controllers
           │
           ▼
       Services
           │
           ▼
        Models
           │
           ▼
       MongoDB

Authentication Flow

User
 │
 ▼
Google OAuth Login
 │
 ▼
Passport.js Authentication
 │
 ▼
JWT Token Generation
 │
 ▼
React Frontend
 │
 ▼
Protected API Requests

Project Structure

FAQ_MAIN_PROJECT/

├── backend/
│   ├── config/
│   │   └── Application configuration
│   │
│   ├── controllers/
│   │   └── Request handling logic
│   │
│   ├── middlewares/
│   │   └── Authentication and validation middleware
│   │
│   ├── models/
│   │   └── MongoDB schemas and database models
│   │
│   ├── routes/
│   │   └── API route definitions
│   │
│   ├── services/
│   │   └── Business logic implementation
│   │
│   ├── utils/
│   │   └── Utility and helper functions
│   │
│   ├── .env.example
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── README.md
├── package.json
└── package-lock.json

API Endpoints

Authentication Routes

Method                    Endpoint                               Description
GET                       /auth/google                    Initiates Google OAuth authentication
GET                     /auth/google/callback                 OAuth callback endpoint
GET                      /auth/current-user              Retrieves authenticated user information
GET                      /auth/logout                        Logs out the current user

FAQ Routes

Method                    Endpoint                    Description
GET                        /faq                    Retrieve all FAQs
POST                      /faq/add                 Create a new FAQ
POST                    /faq/:id/reply            Add a reply to an FAQ
PUT                       /faq/:id                   Update an FAQ
DELETE                    /faq/:id                   Delete an FAQ

Database Design

User Model
Field                        Type
googleId                    String
name                        String
email                       String
role                        String
createdAt                    Date

FAQ Model

Field                        Type
question                    String
answer                      String
createdBy                   String
replies                      Array
createdAt                     Date

Reply Model

Field                        Type
text                        String
createdBy                   String
createdAt                    Date

Role-Based Access Control

Functionality                        Student                        Administrator
View FAQs                              Yes                               Yes
Create FAQs                            Yes                               Yes
Reply to FAQs                          Yes                               Yes
Edit FAQs                               No                               Yes
Delete FAQs                             No                               Yes
Access Admin Panel                      No                               Yes

Development Progress

Phase 1 – Initial Setup

Repository initialization
MERN stack configuration
Database integration
Authentication setup

Phase 2 – Core Features

FAQ creation module
FAQ discussion system
User dashboard
Administrative controls

Phase 3 – Architectural Improvements

Migration to layered backend architecture
Controller-service separation
Improved code maintainability
Better scalability support

Phase 4 – Security Enhancements

Input validation middleware
Chatbot spam protection
Request sanitization improvements
Enhanced authentication flow

Future Enhancements

FAQ categorization and tagging
Advanced search and filtering
Community voting and ranking system
AI-assisted FAQ recommendations
Semantic search integration
Analytics dashboard
Multi-language support
Notification system

Installation

Prerequisites
Node.js (v16 or later)
MongoDB
Git
Clone the Repository
git clone <repository-url>
cd FAQ_MAIN_PROJECT

Install Backend Dependencies
cd backend
npm install

Install Frontend Dependencies
cd ../frontend
npm install

Environment Configuration

Backend (.env)
MONGO_URI=your_mongodb_connection_string

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

JWT_SECRET=your_jwt_secret

SESSION_SECRET=your_session_secret

PORT=5000

Running the Application
Start Backend Server
cd backend
npm start

Start Frontend Application
cd frontend
npm start

The application will be available at:
Frontend: http://localhost:3000

Backend: http://localhost:5000

Contributing

Create a new branch.
Implement the required changes.
Commit changes with meaningful commit messages.
Push changes to the remote repository.
Create a pull request for review.

Contributors

Developed as part of the Vicharanashala Summer Internship Program at IIT Ropar through collaborative team contributions.

License

This project is intended for educational and academic purposes under the Vicharanashala Summer Internship Program.

 
 
