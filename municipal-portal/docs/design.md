# Design Document

## 1. Data Model
Our relational schema (defined via Prisma) consists of the following primary entities:

- **User**: Represents all actors (Citizens, Dept Heads, Field Staff, Admins, Receiving Officers). Differentiated by an Enum `Role`.
- **Department**: A municipal department (e.g., Water Supply, Public Works).
- **Category**: A specific type of issue (e.g., Pothole, Broken Pipe) which belongs to a `Department`.
- **Complaint**: The core entity. Links to a reporting `User` (Citizen) and a `Category`. Tracks status, priority, description, location, and assigned Field Staff. It also tracks Field Staff communication (visit date, contact info, messages).
- **ComplaintMedia**: Stores evidence photos (e.g., 'BEFORE' and 'AFTER' repair).
- **AuditLog**: A historical ledger of every status change made to a complaint, recording who made the change and when.

## 2. API Interface Design

| Endpoint | Method | Role Access | Purpose |
|----------|--------|-------------|---------|
| `/api/auth/register` | POST | All | Register a new user |
| `/api/auth/login` | POST | All | Authenticate and retrieve JWT |
| `/api/complaints` | GET | Citizen/Staff | Retrieve a filtered list of complaints based on RBAC |
| `/api/complaints` | POST | Citizen | Submit a new complaint |
| `/api/complaints/[id]`| GET | Citizen/Staff | Fetch detailed view of a specific complaint, including media and audit logs |
| `/api/complaints/[id]`| PATCH | Staff/Citizen | Progress a complaint through its state machine (assign, solve, verify) |
| `/api/dashboard/stats`| GET | Staff | Retrieve aggregate counts for the Admin Dashboard widgets |

## 3. Key Flows (The State Machine)
Complaints progress through a strict lifecycle via the `PATCH` API:
1. **SUBMITTED**: Created by Citizen.
2. **RECEIVED** (Optional): Acknowledged by Receiving Officer.
3. **FORWARDED**: Sent to specific Department Head.
4. **ASSIGNED**: Dept Head assigns a Field Staff member.
5. **IN_PROGRESS**: Field Staff begins work.
6. **WORK_COMPLETED**: Field Staff marks the physical issue as solved and optionally uploads a photo.
7. **CITIZEN_VERIFICATION**: Dept Head verifies the evidence and requests citizen approval.
8. **CLOSED**: Citizen confirms resolution.

## 4. Error Handling
- **401 Unauthorized**: Missing or invalid JWT token.
- **403 Forbidden**: User attempts an action outside their role's permissions (e.g., a Field Staff trying to assign a ticket).
- **400 Bad Request**: Missing required parameters (e.g., submitting a complaint without a description or category).
- **404 Not Found**: Requesting a non-existent complaint ID.
- **500 Internal Server Error**: Catch-all for database connectivity issues or unexpected runtime exceptions.
