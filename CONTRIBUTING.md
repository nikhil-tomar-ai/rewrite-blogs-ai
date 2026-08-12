# Contributing to SparkyAI

Thank you for your interest in contributing to **SparkyAI**! We welcome bug reports, feature suggestions, documentation improvements, and code contributions from the open-source community.

---

## 🚀 Getting Started

1. **Fork the Repository:** Create your own fork on GitHub.
2. **Clone & Setup:**
   ```bash
   git clone https://github.com/your-username/sparkyai.git
   cd sparkyai
   npm install
   ```
3. **Branching:** Create a feature branch for your work:
   ```bash
   git checkout -b feature/awesome-local-provider
   ```

---

## 🛠️ Code Guidelines

* **TypeScript:** Maintain strict typing across both frontend (`/src`) and backend (`server.ts` & `/src/server`).
* **Local-First Rule:** Never introduce mandatory third-party cloud AI APIs or telemetry calls. All core features must function offline using local LLM provider interfaces.
* **Linting & Verification:**
  ```bash
  npm run lint
  npm run build
  ```

---

## 📩 Submitting Pull Requests

1. Ensure tests and linting pass.
2. Submit a Pull Request targeting `main`.
3. Provide a concise description of your changes and why they benefit the project.
