Set up production deployment configuration# Task 1: User Authentication

## Feature
User authentication (register/login)

## Description
Create a system for users to register for a new account and log in to the application.

## Requirements
- User registration page with fields for username, email, and password
- User login page with fields for email and password
- Secure password hashing using a library like bcrypt
- JWT-based authentication for subsequent requests
- API endpoints for registration and login
- A protected route that only authenticated users can access

## Implementation Steps
1.  **Backend:**
    -   Create a `users` table in the PostgreSQL database with the specified schema.
    -   Implement the `/api/auth/register` endpoint to handle user registration.
    -   Implement the `/api/auth/login` endpoint to handle user login and JWT generation.
    -   Create a middleware to protect routes that require authentication.
2.  **Frontend:**
    -   Create a registration form component in React.
    -   Create a login form component in React.
    -   Implement API calls to the registration and login endpoints.
    -   Store the JWT in local storage or a cookie.
    -   Create a private route component that redirects unauthenticated users to the login page.
