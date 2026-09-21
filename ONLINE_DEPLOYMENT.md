# IntelliQueue online deployment (GitHub + Render)

This project deploys the FastAPI API from the repository root so that it can
load `models/*.pkl` and `yolo11n.pt`. The React frontend is built separately.

## 1. Push the prepared project to GitHub

Open Windows PowerShell in the project folder and run:

```powershell
cd "C:\Users\USER\Desktop\supervised project"
git status
git add .
git commit -m "Prepare IntelliQueue for Render deployment"
git push
```

If this repository has no GitHub remote yet, create an empty repository on
GitHub first, then add its URL and push:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Before committing, use `git status` to confirm that no `node_modules`, virtual
environment, cache, log, or other generated files are staged.

## 2. Create the backend service on Render

1. In Render, choose **New +** > **Blueprint** and connect the GitHub repository.
   Render will detect `render.yaml`. Alternatively, create a **Web Service**
   manually with the repository root as the root directory.
2. For a manual service, enter these exact values:
   - Name: `intelliqueue-api`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Create the service and wait for the deployment to finish. Copy its public
   URL, for example `https://intelliqueue-api.onrender.com`.

Do not set `FRONTEND_URL` yet if the frontend URL is not known. After creating
the frontend in the next section, open the API service's **Environment** page,
set `FRONTEND_URL` to the exact frontend URL (no trailing slash), save it, and
redeploy the API.

Verify the running API in a browser:

- `https://YOUR-API-URL/` should return the API message.
- `https://YOUR-API-URL/docs` should open FastAPI's interactive documentation.

## 3. Create the frontend static site on Render

1. Choose **New +** > **Static Site** and connect the same GitHub repository.
2. Enter these exact values:
   - Name: `intelliqueue-frontend`
   - Build Command: `cd frontend && npm ci && npm run build`
   - Publish Directory: `frontend/dist`
3. In **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: the full API URL from step 2, for example
     `https://intelliqueue-api.onrender.com`
4. Create/deploy the static site. Copy its HTTPS URL.
5. Return to the API service and set `FRONTEND_URL` to that exact frontend URL,
   then redeploy the API.

When using the Blueprint, both values are intentionally marked `sync: false`:
enter the real URLs in the Render dashboard after Render assigns them.

## 4. Final testing

1. Open the deployed frontend URL over HTTPS.
2. Choose a service location and click **Predict Queue**. Confirm prediction
   results appear.
3. Click **Start Camera** and grant browser camera permission. The browser only
   permits camera access from a secure context, so use the Render HTTPS URL
   (not an HTTP URL or an IP address).
4. Confirm the people counter updates. If it reports a connection error, check
   that `VITE_API_URL` exactly matches the API URL and `FRONTEND_URL` exactly
   matches the frontend URL, then redeploy the affected service.

## Local development

The frontend defaults to `http://127.0.0.1:8000` when `VITE_API_URL` is not
set. To set it explicitly, copy `frontend/.env.example` to `frontend/.env`.
Run the backend from the repository root:

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

In a second PowerShell window:

```powershell
cd "C:\Users\USER\Desktop\supervised project\frontend"
npm ci
npm run dev
```
