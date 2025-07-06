# waysorted-web

> The web client for Waysorted – a task-sorting & productivity app built with Next.js and TypeScript.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Tech Stack](#tech-stack)  
3. [Prerequisites](#prerequisites)  
4. [Getting Started](#getting-started)  
5. [Available Scripts](#available-scripts)  
6. [Project Structure](#project-structure)  
7. [Configuration Files](#configuration-files)  
8. [Branching & Pull Request Guidelines](#branching--pull-request-guidelines)  
9. [Contributing](#contributing)  
10. [Contact](#contact)  

---

## Project Overview

This is the frontend for **Waysorted**. It’s a Next.js application using TypeScript, Tailwind/PostCSS, and Lottie for animations. The app communicates with our backend API to manage user tasks, preferences, and sorting logic.

---

## Tech Stack

- **Framework:** Next.js  
- **Language:** TypeScript  
- **Styles:** Tailwind CSS (via PostCSS)  
- **Linting:** ESLint  
- **Animations:** Lottie  
- **Version Control:** Git & GitHub  

---

## Prerequisites

- **Node.js** v16+  
- **npm** (v8+) _or_ **Yarn**  

---

## Getting Started

1. **Clone the repo**  
   ```bash
   git clone git@github.com:waysorted/waysorted-web.git
   cd waysorted-web


2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn
   

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys and other settings.

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start Next.js in development mode      |
| `npm run build`  | Create an optimized production build   |
| `npm run start`  | Serve the production build             |
| `npm run lint`   | Run ESLint on all `.ts` / `.tsx` files |
| `npm run format` | Run Prettier to format code            |

---

## Project Structure

```
waysorted-web/
├── .vscode/              # Editor settings
├── assets/lottie/        # Lottie animation JSONs
├── public/               # Static files (favicon, images, robots.txt)
├── src/                  # Application source
│   ├── components/       # Shared React components
│   ├── pages/            # Next.js page routes
│   ├── styles/           # Global & utility CSS
│   └── utils/            # Helpers, API clients, hooks
├── .gitignore            # Files & folders to ignore in Git
├── jsconfig.json         # Path aliasing for imports
├── tsconfig.json         # TypeScript compiler options
├── next.config.mjs       # Next.js custom configuration
├── eslint.config.mjs     # ESLint rules & plugins
├── postcss.config.mjs    # Tailwind / PostCSS config
├── package.json          # NPM/Yarn scripts & dependencies
└── package-lock.json     # Exact dependency versions
```

---

## Configuration Files

* **`next.config.mjs`** – Next.js build & runtime settings
* **`eslint.config.mjs`** – Linting rules & parser options
* **`postcss.config.mjs`** – Tailwind setup and PostCSS plugins
* **`tsconfig.json`** – TypeScript compiler options
* **`jsconfig.json`** – IDE autocomplete & path mappings

---

## Branching & Pull Request Guidelines

To keep our `main` branch always production-ready, **never push or create PRs directly to `main`**:

1. **Sync your local `main`**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch**

   ```bash
   git checkout -b feature/short-description
   ```

   Naming conventions:

   * `feature/...` for new features
   * `fix/...` for bug fixes
   * `chore/...` for chores and refactors

3. **Commit your changes**

   * Write clear, concise commit messages
   * Focus each commit on a single purpose

4. **Push your branch**

   ```bash
   git push -u origin feature/short-description
   ```

5. **Open a Pull Request**

   * Base branch: `main`
   * Compare: your feature branch
   * Include a descriptive title and reference any related issues

6. **Review & merge**

   * Tag teammates for review
   * Address feedback in follow-up commits
   * Use **Squash and merge** to keep history tidy
   * Delete your branch after merging

---

## Contributing

For more details on our contribution guidelines, refer to [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Contact

If you have any questions, reach out to **@waysorted-team** or open an issue in this repo.
Happy coding! 👩‍💻👨‍💻
