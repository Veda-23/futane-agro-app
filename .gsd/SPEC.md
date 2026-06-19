# Project Specification

## 1. Vision & Goals
Implement a basic Health Check API endpoint for the backend to demonstrate the Get Sh*t Done (GSD) workflow. The endpoint will allow monitoring services to verify if the backend application is running.

## 2. Core Requirements
- Create a simple GET endpoint at `/api/health`.
- The endpoint must return a JSON response containing `{"status": "UP", "timestamp": "<current-time>"}`.
- The endpoint must be accessible without authentication (publicly available).

## 3. Out of Scope
- Checking database connectivity (only basic application health).
- Advanced monitoring tools (e.g., Spring Boot Actuator is excluded for this simple test).

## 4. Current Context
- The backend is a Spring Boot application using Java.
- Authentication is handled by `JwtRequestFilter` which currently secures all `/api/**` routes except `/api/auth/**`.

## 5. Technical Constraints
- Must not use additional dependencies.
- Must configure `WebSecurityConfig.java` to allow unauthenticated access to `/api/health`.

## Status
**FINALIZED**
