# ChatApp Frontend

A React Native chat application built with Expo and TypeScript. The app includes user authentication, a user directory, one-to-one messaging, online presence, local message persistence with SQLite, and EAS-based Android APK builds.

## APK Download

The latest Expo EAS Android build is available here:

- Download / build details: https://expo.dev/accounts/workbysuraj/projects/ChatApp/builds/013ba9cf-6296-4195-8cad-a01ce644d908

Note: The Expo build page may require the build to finish processing before the APK download button appears.

## Features

- User registration and login
- Persistent user session with AsyncStorage
- Real-time chat using Socket.IO
- User list with search
- Online / offline presence indicators
- Conversation history sync from backend
- Local message caching with Expo SQLite
- Profile screen with logout and account deletion
- Android APK build support via Expo EAS

## Tech Stack

- Expo 56
- React Native 0.85
- React 19
- TypeScript
- React Navigation
- Axios
- Socket.IO Client
- AsyncStorage
- Expo SQLite

## Project Structure

```text
ChatApp/
├── App.tsx
├── app.json
├── eas.json
├── package.json
├── assets/
└── src/
    ├── context/
    │   └── AuthContext.tsx
    ├── screens/
    │   ├── ChatListScreen.tsx
    │   ├── ChatScreen.tsx
    │   ├── LoginScreen.tsx
    │   ├── ProfileScreen.tsx
    │   └── RegisterScreen.tsx
    ├── services/
    │   ├── api.ts
    │   ├── socket.ts
    │   ├── storage.ts
    │   └── syncService.ts
    └── utils/
        └── dateFormatter.ts
```

## App Flow

1. On app startup, the auth provider initializes SQLite and restores any saved session from AsyncStorage.
2. If a token and user are present, the app reconnects the Socket.IO client automatically.
3. Unauthenticated users see login and registration screens.
4. Authenticated users land on the chat list screen.
5. The chat list fetches available users from the backend and listens for online user updates from the socket connection.
6. Opening a conversation loads local messages first and then syncs messages from the API.
7. Incoming socket messages are saved locally and merged into the current conversation.
8. Logout clears the socket connection, local messages, and saved auth session.

## Backend Integration

This frontend is currently configured to use the following deployed backend:

- API base URL: https://chat-app-backend-42dp.onrender.com/api
- Socket URL: https://chat-app-backend-42dp.onrender.com

### API capabilities used by the app

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/all`
- `GET /messages/:receiverId`
- `DELETE /users/me`

### Socket events used by the app

- `get_online_users`
- `online_users`
- `send_message`
- `receive_message`

## Local Storage

The app uses two local persistence layers:

### AsyncStorage

Used for:

- auth token
- serialized user profile

### SQLite

Used for:

- local message history cache
- restoring previous conversations
- merging synced server messages with local state

Database file:

- `chatapp.db`

Main table:

- `messages`

Stored message fields:

- `id`
- `sender_id`
- `receiver_id`
- `message`
- `created_at`
- `synced_at`

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Expo CLI tooling via `npx expo`
- EAS CLI for cloud builds: `npm install -g eas-cli`
- Git available in your system PATH

### Install dependencies

```bash
npm install
```

### Start the Expo development server

```bash
npm start
```

### Run on Android through Expo

```bash
npm run android
```

### Run on iOS through Expo

```bash
npm run ios
```

### Run on web

```bash
npm run web
```

## Configuration

### Expo app config

The project is configured in `app.json` with:

- Expo project name and slug
- Android package id: `com.workbysurajmourya.chatapp`
- EAS project id linkage
- splash and icon assets
- Expo plugins for SQLite and splash screen

### EAS build config

The project includes `eas.json` with these profiles:

- `development`: development client build
- `preview`: internal Android APK build
- `production`: Android App Bundle build

## Build Android APK

### Login to Expo

```bash
eas login
```

### Build preview APK

```bash
eas build -p android --profile preview
```

### Build production Android App Bundle

```bash
eas build -p android --profile production
```

## Git / EAS note for Windows

If EAS reports that `git` cannot be found, make sure this directory is available in PATH:

```text
C:\Program Files\Git\cmd
```

For a temporary CMD session fix, run:

```bat
set PATH=C:\Program Files\Git\cmd;%PATH%
```

## Important Behavior Notes

- The app only enables message sending when the socket connection is active.
- Chat history is loaded from local SQLite and then refreshed from the backend.
- Online status depends on socket events emitted by the backend.
- Logging out clears both local chat history and the saved session.
- Deleting the account calls the backend and then logs the user out locally.

## Available Scripts

From `package.json`:

- `npm start` - Start Expo
- `npm run android` - Launch Expo Android flow
- `npm run ios` - Launch Expo iOS flow
- `npm run web` - Launch Expo web flow

## Future Improvements

- Add environment-based backend URL configuration
- Add message delivery and read status handling from the backend
- Add media attachments
- Add group chat support
- Add automated tests
- Add better offline sync conflict handling

## License

This project includes a `LICENSE` file in the repository root.
