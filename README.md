# License Key Portal

Testing project with a protected admin login and an empty dashboard, designed
for deployment on Vercel.

## Environment variables

Copy `.env.example` to `.env.local` and replace every sample value:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET` (at least 32 random characters)

Add the same variables to the Vercel project before deploying.

## Local development

```bash
pnpm install
pnpm dev
```
