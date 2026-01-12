# TableTap - Restaurant Ordering System (Firebase Edition)

## Overview
TableTap is a comprehensive restaurant table ordering and management system migrated to **Firebase**.

## Tech Stack
*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS
*   **Backend**: Firebase (Serverless)
    *   **Auth**: Firebase Authentication
    *   **Database**: Cloud Firestore
    *   **Hosting**: Firebase Hosting

## Setup
1.  Clone repo.
2.  `npm install`
3.  Create `.env` file with Firebase credentials:
    ```
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    ...
    ```
4.  `npm run dev`

## Deployment
1.  `npm run build`
2.  `firebase deploy`

## Architecture
*   **Firestore Collections**: `users`, `restaurants`, `tables`, `categories`, `menuItems`, `orders`
*   **Real-time**: Kitchen view uses `onSnapshot` listeners.
