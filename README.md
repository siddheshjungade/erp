# Solar ERP - Vertical SaaS MVP (Phase 1)

A high-fidelity operational ERP for solar installers built on a modern Google Sheets Database Architecture.

## Features (Phase 1)
- **Dockerized Architecture**: Standard multi-container setup running a Next.js App Router frontend and Node.js Express TypeScript API.
- **Google OAuth 2.0 Integration**: Secure Google-mediated user authentication and dynamic sheets scope delegation.
- **Auto-Initialization Database**: Programmatic discovery and automatic generation of the `"Solar ERP Database"` spreadsheet with clean visual column formatting, frozen header rows, and initial default metadata.
- **Relational Sheets Schema**: Structuring tabular interfaces for `Config`, `Projects`, `Inventory`, `Leads`, and `Financials`.
- **JWT-Secured Handshake**: Session tokens securely delivered and stored via cookies or headers for protected REST endpoints.
- **Premium Light Green & White Theme**: Breathtaking interface featuring dynamic animations, pulsing connection visual indicators, custom auth stepper transitions, and a direct hyperlink to open your Google Sheets database file.

---

## 🛠️ Local Setup Instructions

### 1. Enable Google Cloud APIs
To authorize spreadsheet connections, create a project in the [Google Cloud Console](https://console.cloud.google.com):
1. **Enable APIs**: Navigate to **APIs & Services** and enable the **Google Sheets API** and **Google Drive API**.
2. **Create OAuth Client ID**:
   - Go to **Credentials** -> **Create Credentials** -> **OAuth Client ID**.
   - Set application type to **Web application**.
   - Add **Authorized Redirect URIs**:
     `http://localhost:5000/api/auth/google/callback`
   - Copy the generated `Client ID` and `Client Secret`.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already done by the setup) and replace placeholders with your custom credentials:
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_super_secret_jwt_key_should_be_long_and_random
```

### 3. Launch Docker Orchestration
Execute the following command in your terminal to build and spin up the backend and frontend microservices:
```bash
docker compose up --build
```

- **Frontend Interface**: Access at [http://localhost:3000](http://localhost:3000)
- **Backend Rest API**: Access at [http://localhost:5000](http://localhost:5000)

---

## 🏗️ Project Architecture

```
ERP/
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Local secret configurations
├── backend/                    # Express API (TypeScript)
│   ├── src/
│   │   ├── server.ts           # Entry point
│   │   ├── services/           # Google Auth & Sheet Database services
│   │   └── controllers/        # Handshake callback controllers
└── frontend/                   # Next.js App Router (Tailwind v4)
    ├── src/
    │   ├── context/            # Session Auth Context
    │   ├── app/                # Landing, callback stepper, and dashboard panels
    │   └── globals.css         # Light Green theme color definitions
```
