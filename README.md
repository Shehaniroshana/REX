# REX: Strategic Management Platform

**REX** is an elite, high-performance project management ecosystem. It is architected as a **sovereign desktop application**—a powerful client-side shell that provides the visual fidelity of a high-end web app while giving you total control over where your data lives.

## 📐 BYODB (Bring Your Own Database)

REX is built on the principle of **Data Sovereignty**. Unlike traditional SaaS providers, REX does not own your data. You provide the infrastructure; REX provides the intelligence.

- **Total Isolation**: Securely connect REX to your own local or remote **PostgreSQL** instance via an encrypted setup workflow.
- **Strategic Flexibility**: Point the REX shell to your own cloud cluster (Postgres) or a local development database. You have 100% control over your data persistence.
- **Zero-Access Architecture**: REX is a local-only platform shell. All projects, tasks, and analytics are stored directly in the database you provide—nothing is sent to external proprietary servers.

---

## ✨ The REX Experience

- **💎 Ultra-Glass UI**: A premium, depth-layered interface with transparency and high-contrast design to minimize cognitive load.
- **🌀 Neural Flow**: Interactive background physics responsive to global cursor events, powered by Three.js and tsParticles.
- **📈 Advanced Analytics Engine**: 
  - **Dynamic Burndown**: Real-time sprint velocity tracking vs. ideal delivery pace.
  - **Intel Stats**: Automated project health analysis including average resolution time and historical trends.
- **🛡️ Integrity Layers**: 
  - **Atomic Key Sequencing**: Transaction-guaranteed, collision-free task counting across multi-user environments.
  - **Permission Scoping**: Mandatory service-level membership authorization for all data access.

---

## 🏗️ Technical DNA

### Engineering Stack
- **Engine (Core)**: [Go 1.21+](https://go.dev/) + [Fiber](https://gofiber.io/) (Native OS binary)
- **Interface (Visual)**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Visual Mechanics**: [Three.js](https://threejs.org/) + [Framer Motion](https://www.framer.com/motion/) (Dynamic UI motion)
- **OS Native Shell**: [Electron](https://www.electronjs.org/) + [Electron Builder](https://www.electron.build/)

---

## 🚀 Deployment & Strategy

REX is designed for rapid initialization via an intuitive, encrypted setup flow.

### 1. Preparation & Repository
```bash
git clone <repository-url>
cd rex
```

### 2. Initialization & BYODB Configuration
REX uses an interactive setup layer to establish your custom database connection.
```bash
# Start your local or remote database service (e.g., PostgreSQL)
# Then initialize the REX backend:
cd backend
cp .env.example .env
go run cmd/api/main.go
# Open http://localhost:8080/setup and input your private Database URL
```

### 3. Application Execution
REX can be run as a development environment or a packaged desktop application.
```bash
# Install dependencies from root
npm install

# Build and run the Desktop Application
npm run dev
```

---

## 🔒 Security & Data Integrity
- **Encrypted Local Configuration**: Stores sensitive environment variables using a secure, key-protected store on your machine.
- **Physical Cleanup**: Local file attachments are automatically purged from the disk when their associated records are deleted.
- **Atomic Transactions**: All state-critical operations are wrapped in PostgreSQL transactions to prevent data corruption.

---

## 📦 System Modules
- **`electron/`**: Native bridge and binary embedding logic.
- **`backend/internal/setup`**: Guided configuration and persistence initialization flow.
- **`frontend/src/components/ui/Antigravity`**: Interactive physics background engine.
- **`frontend/src/pages/ReportsPage`**: Complex charting and data intelligence.

---
REX. You own the data. We provide the power.
