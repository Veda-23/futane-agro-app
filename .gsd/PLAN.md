# Phase 1: Implement Public Health Check API

## Context
Based on the finalized `SPEC.md`, we need to expose a `/api/health` endpoint that returns a simple JSON status. This endpoint must bypass the JWT authentication filter.

## Execution Plan

<task type="auto">
  <name>Create HealthController</name>
  <files>backend/src/main/java/com/futaneagro/controller/HealthController.java</files>
  <action>
    Create a new RestController mapping to `/api/health`.
    Return a Map containing "status": "UP" and "timestamp": current LocalDateTime.
  </action>
  <verify>Compile backend using `mvn clean compile` to ensure syntax is correct.</verify>
  <done>Controller exists and compiles without errors.</done>
</task>

<task type="auto">
  <name>Configure Public Access in WebSecurityConfig</name>
  <files>backend/src/main/java/com/futaneagro/config/WebSecurityConfig.java</files>
  <action>
    Update the `SecurityFilterChain` to explicitly `permitAll()` for the `/api/health` path.
  </action>
  <verify>Boot the backend and test the endpoint with `curl -I http://localhost:8080/api/health` without an authorization token to verify it returns HTTP 200.</verify>
  <done>The `/api/health` endpoint is publicly accessible without returning a 401 Unauthorized error.</done>
</task>
