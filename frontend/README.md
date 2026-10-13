# Frontend

React, TypeScript, and Vite client for the EV Cluster Load API.

## Local development

```powershell
npm ci
npm run dev
```

The Vite development server proxies `/api` and `/ws` to `http://127.0.0.1:8000`. Start the FastAPI backend before using the dashboard. Unit tests use MSW only through the test setup; the running application always uses the configured API.

## Vercel

The repository-level `vercel.json` configures the Vercel frontend and FastAPI services. Keep the Vercel project root at the repository root so that both services and the API rewrites are included. The frontend production build uses `VITE_API_URL=/api/v1` and the live WebSocket API path; if the backend is deployed separately, set `VITE_API_URL` to its public `/api/v1` URL and allow the Vercel site origin in the backend CORS configuration.

No third-party API key is required by the frontend. Authentication accounts must be provisioned by the backend; there are no demo credentials or browser-side mock accounts.
