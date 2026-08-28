# XN Academy: Player Identity Network & SITREP Verification System

A competitive tactical gaming identity platform and SITREP score verification network for **XN Academy**.

---

## 🚀 Deployment on Render.com

This repository is pre-configured and 100% ready for zero-configuration deployment on **Render.com** (and other Node.js cloud providers such as Railway, Fly.io, Heroku, or standard VPS).

### Quick Render.com Setup Steps

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: XN Academy Tactical Network"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```

2. **Create a New Web Service on Render**:
   - Go to your [Render Dashboard](https://dashboard.render.com/)
   - Click **New +** -> **Web Service**
   - Connect your GitHub repository

3. **Configure Service Settings**:
   - **Name**: `xn-academy-network` (or any custom name)
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: `>=18.0.0` (Render will use Node 18/20/22 automatically)

4. **Click "Create Web Service"**:
   - Render will automatically execute `npm install`, compile the Vite React client into `dist/`, bundle the Express backend into `dist/server.cjs`, and launch `node dist/server.cjs` listening on the assigned `PORT`.

---

## 🛠️ Local Development & Build Commands

- **Install dependencies**:
  ```bash
  npm install
  ```

- **Run development server** (Vite + Express with live reload on port 3000):
  ```bash
  npm run dev
  ```

- **Build for production**:
  ```bash
  npm run build
  ```
  *(Runs `vite build` to output the frontend into `dist/` and bundles `server.ts` to `dist/server.cjs`)*

- **Run production server**:
  ```bash
  npm start
  ```

- **Run linter / typecheck**:
  ```bash
  npm run lint
  ```

---

## 📁 Architecture

- **`server.ts`**: Full-stack Express REST API backend proxying player identities, SITREP submissions, audit logs, and serving compiled static frontend SPA assets.
- **`src/`**: React 19 + TypeScript frontend with Tailwind CSS, Lucide icons, and Motion animations.
- **`dist/`**: Created during `npm run build` containing production assets and `dist/server.cjs`.
- **`render.yaml`**: Infrastructure-as-Code Blueprint configuration for Render.com.
