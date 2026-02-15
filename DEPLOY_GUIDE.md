# 🚀 BLAST Network - Deployment Guide

This guide will help you deploy the **BLAST Network** website to GitHub Pages using the Command Line (CMD).

## 📋 Prerequisites

* **Git** installed on your computer.
* A **GitHub Account**.

---

## 🛠️ Step 1: Prepare the Project

1. **Open Command Prompt (CMD)** and navigate to your project folder:

    ```cmd
    cd c:\Users\eliecer\Desktop\blockchain-blast
    ```

2. **Initialize Git** (if not already done):

    ```cmd
    git init
    ```

3. **Prepare the Website Folder**:
    * GitHub Pages works best with a specific folder. We will use a `docs` folder.
    * Copy all files from `src/website/` into a new folder named `docs/` in the root of your project.
    * *Note: If you already have a build process, you can skip this, but for manual deployment, this is the easiest way.*

    **Command to create and copy (run in CMD):**

    ```cmd
    mkdir docs
    xcopy src\website\* docs\ /s /e /y
    ```

---

## ☁️ Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in.
2. Click the **+** icon in the top right and select **New repository**.
3. **Repository Name**: `blast-network` (or any name you prefer).
4. **Privacy**: Public.
5. Click **Create repository**.
6. Copy the URL of your new repository (e.g., `https://github.com/YourUsername/blast-network.git`).

---

## ⬆️ Step 3: Upload Code to GitHub

Back in your Command Prompt:

1. **Add all files to Git**:

    ```cmd
    git add .
    ```

2. **Commit your changes**:

    ```cmd
    git commit -m "Initial deploy of BLAST Network"
    ```

3. **Link your local project to GitHub** (Replace URL with yours):

    ```cmd
    git remote add origin https://github.com/YourUsername/blast-network.git
    ```

    *(If it says "remote origin already exists", skip this step).*

4. **Rename branch to main**:

    ```cmd
    git branch -M main
    ```

5. **Push the code**:

    ```cmd
    git push -u origin main
    ```

---

## 🌐 Step 4: Configure GitHub Pages

1. Go to your repository page on **GitHub**.
2. Click on **Settings** (top tab).
3. Scroll down to the **Pages** section (sidebar on the left).
4. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and then select the `/docs` folder (since we copied our site there).
6. Click **Save**.

---

## 🎉 Step 5: Verify Deployment

1. Wait a minute or two.
2. Refresh the GitHub Pages settings page.
3. You will see a banner at the top: **"Your site is live at..."**
4. Click the link to view your live BLAST Network website!

---

## 🔄 Updating your Site

Whenever you make changes to `src/website/`:

1. **Copy changes to `docs/`**:

    ```cmd
    xcopy src\website\* docs\ /s /e /y
    ```

2. **Commit and Push**:

    ```cmd
    git add .
    git commit -m "Update website"
    git push
    ```
