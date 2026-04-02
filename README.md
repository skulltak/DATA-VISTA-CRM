# Data Vista CRM - Enhanced Features

This project is an advanced CRM system built with .NET Core (Backend) and Angular (Frontend), featuring persistent file storage, data analytics, and a built-in Gemini-powered AI Assistant.

## Key Features Implemented

### 1. Persistent File Storage & Gallery
- **IndexedDB Integration**: All uploaded `.xlsx` and `.csv` files are stored locally in the browser using IndexedDB (`NexCrmDB`). This ensures your data persists even after refreshing the page or restarting your browser.
- **Manual Deletion**: Users can now manually delete saved files directly from the Gallery View via the "Delete" button.
- **Async Parsing**: Files are parsed natively in the browser and stored as optimized JSON for instant loading.

### 2. Gemini AI Assistant (Integrated)
- **Real-Time Analysis**: A floating, glassmorphic chat interface powered by Google's Gemini-1.5-Flash model.
- **Backend Proxy**: Secure communication through a .NET `ChatController`, protecting your API key while providing AI insights.
- **Diagnostic Tools**: Built-in test endpoint at `/api/chat` to monitor API health and model availability in real-time.

### 3. Modern UI/UX
- **Glassmorphic Design**: Premium, translucent UI elements for a state-of-the-art aesthetic.
- **Responsive Layout**: Sidebar-driven navigation with a dedicated "File Viewer Gallery" for data management.
- **Interactive Dashboards**: Dynamic pivot tables and data visualization for uploaded spreadsheet data.

## Technical Setup

### Backend (NexCrm.Api)
- **Framework**: .NET Core 8.0
- **Configuration**: Gemini API Key stored securely in `appsettings.json`.
- **Endpoints**:
  - `POST /api/chat`: Process user messages via Gemini API.
  - `GET /api/chat`: Diagnostic check for model availability and API status.
  - `GET /api/health/db`: MongoDB connection health check.

### Frontend (NexCrm-Ui)
- **Framework**: Angular 17+ (Standalone Components)
- **Services**:
  - `FileViewerService`: Handles IndexedDB storage and file parsing.
  - `ChatService`: Manages communication with the backend AI proxy.
- **Components**:
  - `ChatComponent`: Floating chat bubble and message window.
  - `FileViewerComponent`: Gallery view with persistent file management.

## Deployment
- **Frontend**: Hosted as a Static Site on Render.
- **Backend**: Hosted as a Web Service on Render.
- **CI/CD**: Automatic deployment triggered on setiap push to the `main` branch.

---
*Created by [Antigravity AI] by Google Deepmind.*
