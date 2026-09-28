# 📘 Code Explained: A Simple Guide

This file explains "how the code works" in plain English. Think of this application like a **Restaurant**.

---

## 1. The Big Picture 🗺️

The app is split into two main parts, just like a restaurant has a **Dining Area** and a **Kitchen**.

*   **Frontend (`/client`)**: The **Dining Area**. This is what you see and interact with (buttons, maps, forms).
*   **Backend (`/server`)**: The **Kitchen**. This is where the work happens (saving data, checking passwords).
*   **Database (MongoDB)**: The **Pantry**. This is where all the ingredients (data) are stored.

---

## 2. The Backend (Server) 🍳
*Location: `/server`*

This is the brain of the operation.

### `server.js` (The Manager)
This file starts everything up. It connects to the database (opens the pantry) and starts listening for requests (opens the restaurant doors).

### `routes/` (The Menu)
This folder lists what "orders" the server can accept.
*   **`authRoutes.js`**: "I want to login" or "I want to register".
*   **`truckRoutes.js`**: "Give me a list of trucks" or "Add a new truck".
*   *Analogy*: When you click a button, the frontend looks at this menu to know where to send the request.

### `controllers/` (The Chefs)
These files actually do the work.
*   **`authController.js`**: When a "login" order comes in, this file checks if the password is correct/
*   **`truckController.js`**: When an "add truck" order comes in, this file checks if the data is valid and saves it.

### `models/` (The Recipe Cards)
These define what data looks like.
*   **`userModel.js`**: Says a "User" must have a `name`, `email`, and `password`.
*   **`truckModel.js`**: Says a "Truck" must have a `plateNumber` and `capacity`.
*   *Why?* To make sure we don't save a truck without a license plate!

---

## 3. The Database (MongoDB) 🥫
*Cloud Storage*

We use **MongoDB**, which works like a giant filing cabinet.
*   It has drawers (Collections) for `Users`, `Trucks`, `Complaints`.
*   Inside each drawer are folders (Documents) for each individual item.

---

## 4. The Frontend (Client) 🍽️
*Location: `/client`*

This is the interface you use. It's built with **React**, which uses "Components" (building blocks).

### `src/main.jsx` (The Entrance)
The very first file that runs. It loads the App.

### `src/App.jsx` (The Traffic Controller)
This file handles **Routing**.
*   It says: "If the URL is `/admin`, show the Admin Dashboard."
*   "If the URL is `/login`, show the Login Page."

### `src/pages/` (The Screens)
The actual pages you see.
*   **`Login.jsx`**: The form where you type your email.
*   **`admin/AdminTrucks.jsx`**: The page that lists all trucks. It asks the Backend for the list and displays it.

### `src/components/` (The Lego Blocks)
Reusable pieces of code.
*   **`Layout.jsx`**: The Sidebar and Header. We write it once and use it on every page.
*   **`Sidebar.jsx`**: The navigation menu.

### `src/context/` (The Shared Memory)
*   **`AuthContext.jsx`**: Keeps track of "Who is logged in?" so you don't have to login again on every single page.

---

## 5. How They Talk (Axios) 🗣️

We use a tool called **Axios** to send messages from Frontend to Backend.
*   **Frontend**: "Axios, pleas execute `GET /api/trucks`."
*   **Axios**: Flies to the Server.
*   **Server**: "Here is the list of trucks."
*   **Axios**: Flies back to Frontend.
*   **Frontend**: Displays the list on the screen.
