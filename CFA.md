# 🏗️ Fullstack Application Components (CFA)

## 🧱 What exactly is MERN?

**MERN** is an acronym for the four key technologies that make up this specific "Stack." It is one of the most popular ways to build fullstack apps because every part uses **JavaScript**, so the code speaks the same language from top to bottom.

| Letter | Technology | Category | Role in your project |
| :--- | :--- | :--- | :--- |
| **M** | **MongoDB** | Database | Stores your Users, Trucks, and Bins data. |
| **E** | **Express.js** | Backend | Creates the API paths (routes) that React calls. |
| **R** | **React.js** | Frontend | Builds the interactive dashboards and maps. |
| **N** | **Node.js** | Runtime | The engine that lets the Backend run on your computer. |

---

## 🧩 The Major Components

To build a **Fullstack Application** like this one, we divide the work into three major layers. Each layer has a specific job, and they talk to each other to make the app work.

1.  **The Frontend (Client Side)**
    *   **Goal**: What the user sees and clicks.
    *   **Role**: It takes user input (like a login form) and sends it to the server. It also receives data from the server and displays it nicely (like the charts and maps).
    *   **Tech used here**: React, Tailwind CSS, Lucide Icons.

2.  **The Backend (Server Side)**
    *   **Goal**: The "Brain" of the app.
    *   **Role**: It handles security (checking passwords), processes logic (calculating bin statistics), and manages the flow of data. It serves as the bridge between the user and the database.
    *   **Tech used here**: Node.js, Express.js.

3.  **The Database (Storage)**
    *   **Goal**: Where information "lives."
    *   **Role**: It stores all the persistent data so it doesn't disappear when you refresh the page. This includes every user account, every garbage bin location, and every complaint history.
    *   **Tech used here**: MongoDB.

**In short**: **React** builds the pages, **Node & Express** handle the logic, and **MongoDB** remembers the data! 🚀
