# 🏗️ Express + React: How the Backend Works

This guide explains the **Node.js** and **Express.js** part of this project, including where to find the code and how it talks to **React**.

---

## 🟢 1. Node.js (The Engine)
**Node.js** is the tool that allows us to run JavaScript on the computer (not just in the browser). It is the "Engine" that powers the entire Backend.

*   **Location**: Everything in the `/server` folder runs on Node.js.
*   **Startup**: When you run `node server.js`, Node.js starts the engine.

---

## 🚂 2. Express.js (The Framework)
**Express.js** is a light framework built on top of Node.js. It simplifies creating a "Server" that can listen for requests (like a waiter taking orders).

### A. The Server Entry Point
File: [`server/server.js`](file:///Users/sakshamm/Desktop/EXAM/server/server.js)

This code creates the "App" and tells it to listen on a port (like 5001).
```javascript
const express = require('express');
const app = express();

// This allows the server to read JSON data sent from React
app.use(express.json());

app.listen(5001, () => {
    console.log('Server running on port 5001');
});
```

### B. The Routes (The Doorway)
File Example: [`server/routes/truckRoutes.js`](file:///Users/sakshamm/Desktop/EXAM/server/routes/truckRoutes.js)

Routes define the URL paths that the frontend can call.
```javascript
// This tells Express: "If someone calls DELETE on this URL, run the deleteTruck function"
router.route('/:id').delete(protect, admin, deleteTruck);
```

### C. The Controllers (The Logic)
File Example: [`server/controllers/truckController.js`](file:///Users/sakshamm/Desktop/EXAM/server/controllers/truckController.js)

This is where the actual "cooking" happens. Express passes the request to these functions.
```javascript
const deleteTruck = async (req, res) => {
    const truck = await Truck.findById(req.params.id);
    if (truck) {
        await truck.deleteOne();
        res.status(200).json({ message: 'Truck removed' });
    }
};
```

---

## 🤝 3. The React Connection (How they talk)
The **React Frontend** doesn't know what happens inside the database. It just sends a "Request" to Express.

### The Messenger (Axios)
File Example: [`client/src/pages/admin/AdminTrucks.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/pages/admin/AdminTrucks.jsx)

React uses **Axios** to send a message to the Express server.
```javascript
// React saying: "Hey Express, please delete the truck with this ID"
await axios.delete(`http://localhost:5001/api/trucks/${id}`, config);
```

---

## 📊 Summary of Flow

1.  **User** clicks "Delete" in **React**.
2.  **React** sends a `DELETE` request via **Axios**.
3.  **Express** receives the request at the **Route** (`/api/trucks/:id`).
4.  **Express** calls the **Controller** function (`deleteTruck`).
5.  The **Controller** tells **MongoDB** to remove the data.
6.  **Express** sends a "Success" message back to **React**.
7.  **React** updates the screen for the user.

---

### 📂 Quick File Links:
*   [Server Core](file:///Users/sakshamm/Desktop/EXAM/server/server.js)
*   [Truck Logic](file:///Users/sakshamm/Desktop/EXAM/server/controllers/truckController.js)
*   [Auth Logic](file:///Users/sakshamm/Desktop/EXAM/server/controllers/authController.js)
*   [Database Connection](file:///Users/sakshamm/Desktop/EXAM/server/config/db.js)
