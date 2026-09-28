# ⚛️ React.js: How the Frontend Works

This guide explains how **React.js** is used to build the CleanCity user interface, including where the code lives and how it functions.

---

## 🏗️ 1. The Building Blocks (Components)
React uses **Components**—small, reusable pieces of code that act like Lego blocks.

*   **Location**: [`client/src/components/`](file:///Users/sakshamm/Desktop/EXAM/client/src/components/)
*   **Example**: [`Sidebar.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/components/Layout.jsx) (the navigation menu) is a component used on every dashboard.

---

## 🚥 2. The Traffic Controller (Routing)
We use **React Router** to decide which "Page" to show based on the URL.

*   **File**: [`client/src/App.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/App.jsx)
*   **How it works**:
```javascript
// This tells React: "If the user goes to /admin, show the AdminDashboard"
<Route path="/admin" element={<AdminDashboard />} />
```

---

## 🧠 3. Memory & Logic (State)
React uses **"State"** to remember things (like if a user is logged in or if a map is loading).

### A. `useState` (Short-term Memory)
Used for data that changes on a single page.
*   **Example**: [`AdminTrucks.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/pages/admin/AdminTrucks.jsx) uses state to remember the list of trucks.
```javascript
const [trucks, setTrucks] = useState([]); // Initially empty, then filled with data
```

### B. `useEffect` (The Action Taker)
Used to "do something" as soon as a page opens (like fetching data).
```javascript
useEffect(() => {
    fetchTrucks(); // Run this function when the page loads
}, []);
```

---

## 🌍 4. Global Memory (Context)
Sometimes data needs to be shared across *all* pages (like user login info). We use **Context** for this.

*   **File**: [`client/src/context/AuthContext.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/context/AuthContext.jsx)
*   **Purpose**: It remembers who the `user` is even when you move from the Dashboard to the Settings page.

---

## 🎨 5. Styling (Tailwind CSS)
Instead of writing long CSS files, we use **Tailwind** utility classes directly in the HTML.

*   **Example**:
```html
<div className="bg-white p-6 rounded-lg shadow-xl">
  <!-- This makes a white box with padding, rounded corners, and a shadow -->
</div>
```

---

## 🛰️ 6. Talking to the Backend (Axios)
React cannot talk to the Database directly. It uses **Axios** to send a "request" to the Express server.

*   **Example from Resident Dashboard**:
```javascript
// React asking the server for the list of bins
const { data } = await axios.get('http://localhost:5001/api/bins', config);
setBins(data); // Updating memory with the new data
```

---

## 📂 Key File Locations:
*   **Entry Point**: [`main.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/main.jsx) (Starts the app)
*   **Main Wrapper**: [`App.jsx`](file:///Users/sakshamm/Desktop/EXAM/client/src/App.jsx) (Handles routes)
*   **Dashboards**: [`client/src/pages/`](file:///Users/sakshamm/Desktop/EXAM/client/src/pages/) (Admin, Driver, Resident)
*   **Styling**: [`index.css`](file:///Users/sakshamm/Desktop/EXAM/client/src/index.css) (Global styles)

---

### 💡 Summary Flow:
1. **App.jsx** checks the URL.
2. It loads a **Page** (e.g., AdminBins.jsx).
3. The Page uses **useEffect** to ask the Backend for data.
4. The Backend sends **JSON data**.
5. React saves that data in **useState**.
6. React **Re-renders** the screen to show the new data to the user.
