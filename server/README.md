# ClientFlow Backend Server

This is the backend API engine for **ClientFlow**, engineered with Node.js, Express.js, and Prisma ORM accessing a MySQL database instance.

## Stack Overview
- **Runtime**: Node.js
- **Server**: Express.js
- **Database ORM**: Prisma ORM with MySQL driver
- **Authentication**: Stateless JSON Web Tokens (JWT) & bcrypt passwords
- **AI Recommendation Module**: Rule-based analytical logic in pure JavaScript (`src/ai/`)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL instance

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up the local `.env` configuration file specifying database connection url, server ports, and authentication secrets.
3. Synchronize database schema and generate Prisma client:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Execution
Start the dev listener with hot-reloads via nodemon:
```bash
npm run dev
```
The server binds to port `5000` by default.
