# Chat Application

Welcome to the Chat Application! This is a modern, real-time chat platform built with React, Node.js, Express, MongoDB, and Socket.IO. It allows users to engage in private and group chats, share files, and manage groups with an intuitive interface.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- Real-time private and group messaging using Socket.IO.
- User authentication and profile management.
- File sharing within chats.
- Group creation, member addition, and deletion.
- Responsive design for desktop and mobile devices.
- Modern UI with a cohesive color scheme (root color: `#2E7D32`).
- Message deletion for senders.
- Auto-scrolling chat interface.

## Installation

### Prerequisites

- Node.js (v14.x or later)
- MongoDB (local or remote instance)
- npm or yarn

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sarthak03dot/chat-app.git
   cd chat-app

   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```
3. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   ```
4. **Set up environment variables:**

   ### Create a .env file in the server directory with the following: text

   - PORT=5000
   - MONGODB_URI=mongodb://localhost:27017/chatapp
   - JWT_SECRET=your-secret-key

   ***

# Usage

- Sign Up/Login: Register a new account or log in with existing credentials.
- Chat: Navigate to /chat/:userId for private chats or /chat/group/:groupId for group chats.
- Groups: Create or join groups via the Groups page (/groups).
- Profile: Manage your profile settings on the Profile page (/profile).
- Logout: Use the logout button in the navbar.

---

# Project Structure

chat-application/
├── client/ # React frontend
│ ├── src/
│ │ ├── components/ # React components (e.g., Navbar, Chat, Footer)
│ │ ├── styles/ # CSS files
│ │ ├── App.js # Main React app
│ │ └── ...
│ ├── package.json
├── server/ # Node.js backend
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ ├── middleware/ # Authentication middleware
│ ├── .env # Environment variables
│ ├── index.js # Server entry point
│ └── package.json
├── README.md # This file
└── ...

---

# Technologies Used

- Frontend: React, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Real-Time: Socket.IO
- Styling: CSS with custom variables
- Authentication: JWT (JSON Web Tokens)

---

# Contributing

### We welcome contributions to improve the Chat Application! Here's how you can help:

1. **Fork the repository.**
2. **Create a new branch:**

   ```bash

   git checkout -b feature/your-feature-name

   ```

3. **Make your changes and commit:**

   ```bash
   git commit -m "Add your feature or fix"

   ```

4. **Push to the branch:**

   ```bash

   git push origin feature/your-feature-name

   ```

5. **Open a Pull Request with a clear description of your changes.**

   - Please ensure your code follows the project's style guidelines and includes tests where applicable.

---

# License

 - This project is licensed under the MIT License. See the file for details.

# Contact

- Author: [Sarthak Singh] (sarthak03december@gmail.com)
- GitHub: https://github.com/sarthak03dot
- Issues: Report bugs or suggest features here.

---

# Support

- If you like this project, give it a ⭐ on GitHub and share it with others!
