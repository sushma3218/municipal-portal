# NagarMitra - Municipal Portal

NagarMitra is a modern, comprehensive Public Grievance Management System built to bridge the gap between citizens and municipal authorities. It provides an intuitive platform for citizens to report civic issues and for municipal staff to efficiently track, manage, and resolve them.

## Live Demo & Video Demonstration

- **Live Portal**: [https://municipal-portal-two.vercel.app/](https://municipal-portal-two.vercel.app/)
- **Note on Video Demonstration**: The demonstration videos showing the full application workflow (Citizen -> Receiving Officer -> Dept Head -> Field Staff -> Admin) are included in this repository. Due to the large file size, please download the videos locally to view them smoothly.

## Key Features

- **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for Citizens, Receiving Officers, Department Heads, Field Staff, and Administrators.
- **End-to-End Complaint Tracking**: Real-time status updates from submission to resolution.
- **Evidence-Based Resolution**: Support for "Before" and "After" photos to ensure accountability.
- **Service Level Agreements (SLAs)**: Automated tracking of deadlines with visual warnings and alerts for overdue complaints.
- **Audit Trails**: Detailed history of every action taken on a complaint.

## User Roles

1. **Citizen**: Can register, submit complaints with location and media, track the progress, and finally confirm if the issue is satisfactorily resolved.
2. **Receiving Officer**: Triages incoming complaints and forwards them to the appropriate municipal department.
3. **Department Head**: Reviews forwarded complaints, assigns them to field staff, verifies submitted evidence, and monitors SLA compliance.
4. **Field Staff**: Receives assignments, starts work, updates citizens with visit schedules, and submits photographic evidence upon completion.
5. **Admin**: Has oversight over the entire system and can intervene when necessary.

## Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Lucide React (Icons)
- **Backend**: Next.js API Routes
- **Database**: [Prisma ORM](https://www.prisma.io/) with SQLite (LibSQL)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd municipal-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the environment variables:
   Ensure you have a `.env` file in the root directory with the following (or similar) configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_jwt_secret_key"
   ```

4. Initialize the database schema:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [(https://municipal-portal-two.vercel.app/)] with your browser to see the result.

## License
This project is for demonstration and developmental purposes.
