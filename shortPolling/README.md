## Short Polling Playground

Spring Boot backend exposes `/polling` endpoints that simulate a background job so you can try short vs long polling. A lightweight Vite + React frontend lives under `frontend/` to interact with those endpoints.

### Backend

```bash
./gradlew bootRun
```

The service listens on `http://localhost:8080`. Endpoints:
- `POST /polling/start/job` &rarr; start a job and return `jobId`
- `GET /polling/shortPoll/{jobId}` &rarr; one-off status fetch
- `GET /polling/longPoll/{jobId}` &rarr; blocks until completion (≈15s) or timeout (30s)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api/*` calls to the backend, so it will work as long as the backend runs locally. If you deploy the frontend elsewhere, set `VITE_API_BASE` to the backend URL (e.g. `VITE_API_BASE=https://example.com/polling npm run build`).

Use the UI to start a job, trigger/on-demand short polling, or trigger long polling. Once a job starts the frontend automatically short-polls every 2 seconds (logging responses to the browser console) and stops polling when the job finishes. 
