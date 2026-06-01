# Capstone Project

Deployment target:

- Frontend: Vercel, with Root Directory set to `frontend`
- Backend API: Railway, using the root `Dockerfile`
- Database: Railway MySQL, exposed to the backend through `DATABASE_URL`

## Environment Variables

### Vercel Frontend

Set this in Vercel Project Settings:

```env
NEXT_PUBLIC_API_BASE=https://your-backend.up.railway.app
```

Do not use `localhost` for production. The frontend calls this URL directly from the browser.

### Railway Backend

Set these in Railway Variables:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

`DATABASE_URL` can be either `mysql://...` from Railway or `mysql+pymysql://...`; the backend normalizes `mysql://...` automatically.

For Vercel preview deployments, optionally add:

```env
ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app
```

## Deploy Notes

1. Deploy the backend service to Railway first and copy its public URL.
2. Add that backend URL as `NEXT_PUBLIC_API_BASE` in Vercel.
3. Add the Vercel frontend URL as `ALLOWED_ORIGINS` in Railway.
4. Redeploy both services after changing environment variables.
