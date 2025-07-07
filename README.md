# Lets Chat

Lets Chat is a modern, full-featured chat application built with React, Vite, and Firebase. It supports individual and group messaging with a clean, responsive design.

## Features

- **User Registration & Login**: Secure authentication with email and password.
- **Individual Chat**: One-on-one messaging with real-time updates and notification.
- **Group Chat**: Create and join groups, manage members, and assign admins.
- **Tagging Friends**: Tag friends for quick access in a dedicated dashboard section.
- **View Once Messages**: Send messages that can only be viewed once.
- **Emojis & Media Sharing**: Send emojis, images, and files in any chat.
- **Chat Link Sharing**: Share unique links to invite others to chats or groups.
- **Responsive Design & Dark Mode**: Works great on desktop, tablet, and mobile, with a dark mode toggle.

## Getting Started

### Prerequisites
- Node.js (v16)
- npm
- A Firebase project (with Authentication, Firestore, and Storage enabled)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/swagata12/lets-chat.git
   cd lets-chat/letsChatApp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Firebase:**
   - Copy your Firebase config into `src/firebase.js`.
   - Make sure Authentication, Firestore, and Storage are enabled in your Firebase console.
4. **Start the app:**
   ```bash
   npm run dev
   ```
   The app will be available at localhost or as shown in your terminal.

## Usage
- Register a new account or log in with your email and password.
- Start individual chats or create groups from the dashboard.
- Tag friends for quick access.
- Share chat/group links to invite others.
- Use the emoji picker and file attachment options in the chat input.
- Start a video call from any chat.
- Switch between light and dark mode using the toggle in the top right.

## Deployment
- To build for production:
  ```bash
  npm run build
  ```


## Notes

- Content moderation uses a simple keyword filter; you can expand the prohibited words list in `src/utils.js`.
- For any issues or feature requests, open an issue or submit a pull request.

---

Built by Swagata.
