# 🔥 Flaming Prayer Wall
> *"The fire on the altar must be kept burning; it must not go out."* — Leviticus 6:12  
> **Convener & Lead Shepherd:** PDaniel Olawande (*Flaming Network / The Envoys / YMR*)

A sacred, modern, and responsive Christian prayer platform built for fervent intercession, community prayer support, and verified pastoral responses.

---

## ✨ Features

- **The Flaming Prayer Wall**: A public altar where believers lay their petitions, categorize requests (Healing, Family, Deliverance, Spiritual Growth, etc.), and read active petitions.
- **"I Prayed" Intercession Counter**: One-click intercession button with duplicate-prevention mechanism (IP/fingerprint hashing for guests, user ID mapping for members).
- **Personal Pastoral Prayer by PDaniel Olawande**: Dedicated pastoral intercessory workflow. Petitions answered by Pastor Daniel are highlighted with a gold emblem, verified shepherd badge, and his direct prophetic prayers.
- **Sacred Dark Theme & Regal Typography**: Custom obsidian and altar slate palette (`#070B12`, `#0E1524`, `#F59E0B`) with **Cinzel** (classical roman serif) and **Plus Jakarta Sans** (humanist sans-serif).
- **Three-Tier Privacy Options**:
  - `Public`: Appears on the main Flaming Prayer Wall.
  - `Pastor Only (Confidential)`: Encrypted and visible solely to Pastor Daniel and the author.
  - `Unlisted / Link Only`: Accessible only via a direct secret URL.
- **Anonymous Petitions**: Option to withhold the author's real name while receiving prayer.
- **Secure Pastoral & Member Authentication**: Secure JWT-based authentication for believers and pastoral administrators.
- **Pastoral Command Center**: Awaiting-intercession queue, filterable prayers, direct pastoral response release, member management, and platform moderation.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+ recommended; Node v24 tested with native `node:sqlite`)
- npm

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd "pdaniel-prayer"

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file (copied from `.env.example`):
```env
PORT=3000
JWT_SECRET=your-secure-jwt-secret-here
NODE_ENV=development
```

### 4. Run the Application
```bash
# Start server (auto-initializes & seeds SQLite database on first run)
npm start
```
Open **`http://localhost:3000`** in your browser.

### 5. Run Verification & Test Suite
```bash
npm test
```

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS Design Tokens, Modular Vanilla ES6 JavaScript (No bloated frameworks).
- **Backend**: Express 5 on Node.js.
- **Database**: SQLite with Node 24 native `node:sqlite` (`DatabaseSync` in WAL mode). Zero node-gyp or C++ compilation dependencies.
- **Security**: BCrypt password hashing, JWT bearer tokens, SHA-256 fingerprinting for duplicate prayer prevention.

---

## 📜 License
ISC
