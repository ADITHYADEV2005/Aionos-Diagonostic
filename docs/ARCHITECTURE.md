# AIONOS Diagnostic Platform Documentation

## Architecture & Features

### 1. Cloud Sync Engine
The Cloud Database Sync Engine connects the frontend React application with the Python Flask AI Server (`ai_server.py`) and MongoDB database running on `http://localhost:8000`.

- **Endpoint**: `/api/patient/history` & `/api/patient/add`
- **Status Indicator**: Real-time status indicator (`Active (MongoDB Connected)`)
- **Manual Sync**: Allows instant synchronization of local and remote patient diagnostic records.

### 2. Local Auto Backup & Restore
- **Export**: Downloads a complete `.json` file (`AIONOS_Patient_Backup_YYYY-MM-DD.json`) containing patient scans, organ classifications, elastography measurements, and system preferences.
- **Restore**: Allows importing a JSON backup file to restore patient scan records into local state.

### 3. Non-Ultrasound Image Detection
- **Computer Vision Engine**: Evaluates color saturation, B-mode grayscale RGB channel variance, and acoustic dark boundary ratios.
- **Alert UI**: Displays an amber warning card if a standard color photo or non-ultrasound image is uploaded.

### 4. Profile Picture (DP) Management
- **Avatar Uploader**: Allows uploading custom profile photos (Data URLs) in Settings.
- **App-Wide Sync**: Automatically syncs avatar across Settings, Dashboard, and header cards via `user-updated` window events.
