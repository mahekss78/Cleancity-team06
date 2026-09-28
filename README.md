# 🏙️ CleanCity - Smart Waste Management System

Welcome to **CleanCity**, a comprehensive platform designed to streamline waste management for cities. This application connects Residents, Drivers, and Administrators in a unified system to ensure cleaner neighborhoods and efficient operations.

---

## 🚀 About the Project

CleanCity aims to digitize the waste collection process. It allows:
- **Residents** to report issues (like overflowing bins) and track their collection history.
- **Drivers** to view their daily routes, check bin status, and mark tasks as complete.
- **Admins** to oversee the entire operation, manage the fleet (trucks/drivers), and analyze waste data.

### 👥 User Roles & Features

| Role | Key Features |
| :--- | :--- |
| **Resident** | • **Dashboard**: View collection schedules.<br>• **Report Issue**: Upload photos of overflowing bins.<br>• **History**: Track past reports and status.<br>• **Profile**: Manage address and personal info. |
| **Driver** | • **Route Maps**: Interactive map with assigned bins.<br>• **Task List**: Daily list of bins to collect.<br>• **Vehicle Check**: Pre-trip inspection logs.<br>• **History**: Record of completed routes. |
| **Administrator** | • **Analytics**: Charts & graphs (Waste Volume, Efficiency).<br>• **Fleet Management**: Add/Remove Trucks & Drivers.<br>• **Complaints Board**: Resolve resident reports.<br>• **Bin Inventory**: Monitor fill levels and status. |

---

## 🛠️ Technology Stack

We use the **MERN Stack** for a robust and scalable architecture:

- **MongoDB**: Database to store users, reports, trucks, and bin data.
- **Express.js**: Backend framework to handle API requests.
- **React.js**: Frontend library for building the user interface.
- **Node.js**: Runtime environment for the server.
- **Tailwind CSS**: For modern, responsive, and beautiful styling.

---

## 📂 Project Structure

- **`/client`**: Contains the Frontend React Code.
    - `src/pages`: Individual pages for Admin, Driver, and Resident.
    - `src/components`: Reusable UI elements (Sidebar, Charts, Maps).
    - `src/context`: State management (Authentication, Theme).
- **`/server`**: Contains the Backend Node.js Code.
    - `models`: Database schemas (User, Truck, Complaint, Bin).
    - `controllers`: Logic/Functions for each feature.
    - `routes`: API endpoints definition.

---

## ⚡ Getting Started

Follow these steps to set up the project locally:

### 1. Prerequisites
- Node.js installed.
- MongoDB installed or a MongoDB Atlas URI.

### 2. Setup Server (Backend)
```bash
cd server
npm install    # Install dependencies
# Create a .env file with:
# PORT=5001
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
npm start      # Run the server
```

### 3. Setup Client (Frontend)
```bash
cd client
npm install    # Install dependencies
npm run dev    # Start the React app
```

The app should now be running at `http://localhost:5173`!

---

## 📞 API & Development

For developers, we have a detailed API guide explaining how to interact with the backend.
👉 **[Read the API Guide](./API_GUIDE.md)**
