# Contributing to İşEmriAl

Thank you for your interest in contributing to **İşEmriAl**! We welcome bug fixes, documentation improvements, and feature proposals that help small technical repair workshops operate more efficiently.

---

## 1. Code of Conduct

Please treat all community members and contributors with respect, professionalism, and constructive feedback.

---

## 2. Development Workflow

1. **Fork the Repository:** Create your own fork on GitHub.
2. **Clone your fork:**
   ```bash
   git clone https://github.com/<your-username>/isemrial.git
   cd isemrial
   ```
3. **Install Dependencies:**
   ```bash
   # Root / Frontend
   pnpm install

   # Backend
   cd backend
   pnpm install
   cd ..
   ```
4. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```
5. **Local Development:**
   - Follow the setup guide in [README.md](README.md).
   - Ensure the light-first Bubilet-inspired design system tokens and WCAG 2.2 AA contrast rules are respected (see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)).
   - Do not commit real secrets or `.env` files.
6. **Test Your Changes:**
   ```bash
   # Frontend build & typecheck
   pnpm run build

   # Backend build
   cd backend
   pnpm run build
   ```
7. **Commit & Push:**
   ```bash
   git commit -m "feat(work-orders): add export action"
   git push origin feat/your-feature-name
   ```
8. **Submit a Pull Request:** Open a PR against the `master` branch of `ErdemYy/isemrial`. Describe the changes, motivation, and include before/after screenshots if UI changes were made.

---

## 3. Design & Code Principles

- **Light-First & Accessible:** Warm/cool off-white backgrounds, dark navy-gray typography, controlled emerald accent (`#20C875`), and high-contrast primary buttons.
- **Realistic Turkish Operational Copy:** UI text must remain natural Turkish.
- **Tenant Isolation:** All backend queries must explicitly scope to the active user's `organizationId`.
- **No Unverified Claims:** Do not claim automatic SMS, payment, or WhatsApp integrations; the app currently supports client-side `wa.me` draft links.
