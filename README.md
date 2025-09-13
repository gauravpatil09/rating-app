# Rating App (Full project ZIP)

This bundle contains a full-stack rating application:
- Backend: Express.js + Sequelize + MySQL
- Frontend: React + Bootstrap

## Quick run steps (after extracting):

1. Backend
   - Open terminal in `backend` folder
   - Copy `.env.example` to `.env` and set `DB_*` values (DB_NAME should be `rating_app` or update it)
   - Run `npm install`
   - Run `npm run dev` (or `npm start`)

2. Frontend
   - Open terminal in `frontend` folder
   - Run `npm install`
   - Run `npm start`

3. Database
   - Create database `rating_app` in MySQL before starting backend:
     ```sql
     CREATE DATABASE rating_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

4. Seed admin (optional)
   - After server starts, you can create an admin via DB or add a temporary seed in `server.js` (see project guide).

If you face any errors, paste the terminal error here and I'll help debug.
