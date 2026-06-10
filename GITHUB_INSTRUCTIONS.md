# 🚀 How to Safely Upload Your FAQ Project to GitHub

GitHub is a public platform, so **protecting your secrets** (like database passwords and Google API keys) is extremely important. 

This guide explains how your project is secured and how to push it to GitHub safely step-by-step.

---

## 🛡️ Security Check (Already Set Up!)

We have set up two key security practices to protect your keys:

1. **Root `.gitignore` File:**
   We created a `.gitignore` file at the root folder. It tells Git to **never upload** your `backend/.env` file or `node_modules` folders to GitHub. Your real passwords will stay safe on your computer.
2. **`.env.example` File:**
   We created a template file called `backend/.env.example`. This file shows other developers what variables are needed (like `MONGO_URI`, `GOOGLE_CLIENT_ID`) without showing your actual values.

---

## 💻 Step-by-Step GitHub Upload Commands

Open your VS Code terminal at the root of `FAQ_project` and run these commands:

### Step 1: Initialize Git (If not already initialized)
```bash
git init
```

### Step 2: Add all files
This stages all files. Because of our `.gitignore` file, your sensitive `.env` and heavy `node_modules` folders will be ignored automatically.
```bash
git add .
```

### Step 3: Check staged files (Optional but recommended for peace of mind)
Run this command to see what files are going to be uploaded. You should **NOT** see `backend/.env` or any `node_modules` listed in green.
```bash
git status
```

### Step 4: Create your first commit
```bash
git commit -m "Initial commit: Complete FAQ Project with Local Dev Bypass and secure config"
```

### Step 5: Link to your GitHub Repository
1. Go to your GitHub account and create a **New Repository** (keep it public or private).
2. Copy the repository link (looks like `https://github.com/your-username/your-repo-name.git`).
3. Run these commands to set the branch to main and link the remote repository:
```bash
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_LINK_HERE
```
*(Replace `YOUR_GITHUB_REPOSITORY_LINK_HERE` with the link you copied).*

### Step 6: Push your code to GitHub!
```bash
git push -u origin main
```

---

## 👥 How Your Teammate Can Run the Cloned Project

When your teammate clones the project from GitHub, they can run it easily:
1. Open the project in VS Code.
2. Copy `backend/.env.example` and rename the copy to `.env`.
3. Fill in the `MONGO_URI`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in their new `.env`.
4. Run `npm install` and `npm start` in both the `backend` and `frontend` folders!
