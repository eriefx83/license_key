# Xeno Network

License management portal with database-backed user roles, product access
assignments and deployment on Vercel.

## Environment variables

Copy `.env.example` to `.env.local` and replace every sample value:

- `DATABASE_URL`
- `SESSION_SECRET` (at least 32 random characters)

Add the same variables to the Vercel project before deploying.

User passwords are stored as salted scrypt hashes in the `users` table. Run the
SQL migration in `migrations/001_create_users.sql` before using the login.

## Local development

```bash
pnpm install
pnpm dev
```
