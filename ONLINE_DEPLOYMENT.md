# IntelliQueue free static deployment (GitHub Pages)

IntelliQueue is now a fully static React/Vite website. It needs no Render
service, no Python server, and no API keys. The browser loads the bundled YOLO
ONNX model and runs camera detection locally over GitHub Pages HTTPS.

## Push to GitHub

```powershell
cd "C:\Users\USER\Desktop\supervised project"
git status
git add .
git commit -m "Deploy IntelliQueue as a static GitHub Pages app"
git push origin main
```

## Enable GitHub Pages

1. Open `https://github.com/Vinayak262/IntelliQueue/settings/pages`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push the commit. The **Deploy IntelliQueue to GitHub Pages** workflow builds
   `frontend/dist` and deploys it automatically.
4. After the workflow succeeds, open
   `https://Vinayak262.github.io/IntelliQueue/`.

The website uses HTTPS, so browsers can request camera permission. Grant the
permission after pressing **Start Camera**. The first run downloads the bundled
local model from the same GitHub Pages site; camera frames never leave the
browser.

## Local development

```powershell
cd "C:\Users\USER\Desktop\supervised project\frontend"
npm ci
npm run dev
```
