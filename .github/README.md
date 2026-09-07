# Futane Agro ERP - CI/CD & DevOps Automation

This directory contains the GitHub Actions workflows and automation configuration for **Futane Agro ERP**.

---

## 🚀 Workflows Overview

| Workflow | File | Triggers | Description |
| :--- | :--- | :--- | :--- |
| **Local CI & Build Pipeline** | [deploy.yml](workflows/deploy.yml) | `push`, `pull_request`, `workflow_dispatch` (Branches: `main`, `enterprise-db-redesign`) | Validates Backend (Java 17 / Maven), Frontend (Node 18 / Angular), and Docker container build integrity. |
| **Local Runner (Self-Hosted)** | [local-runner.yml](workflows/local-runner.yml) | `workflow_dispatch` | Executes directly on your local workstation runner for local UAT verification and fast diagnostics. |

---

## 💻 Running GitHub Actions Locally (Without Cloud Runners)

You can run these workflows directly on your Windows workstation using the pre-configured `act` runner:

```powershell
# Run the full pipeline locally
.\run-local-actions.bat

# Run only backend verification
.\run-local-actions.bat backend

# Run only frontend verification
.\run-local-actions.bat frontend

# Run only Docker build validation
.\run-local-actions.bat docker
```

---

## 🔑 Environment Secrets & Configuration

The local pipeline has been decoupled from cloud VMs (Oracle VM / SSH keys removed). When running in GitHub or locally, it relies only on standard build tools:
- **Java 17 (Temurin)**
- **Node.js 18.x**
- **Docker Engine**
