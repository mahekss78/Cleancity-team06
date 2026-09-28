# 🔌 CleanCity API Guide

This guide explains the RESTful API endpoints available in the CleanCity application. These are the "rules" for how the Frontend (React) talks to the Backend (Server).

---

## 1. Authentication (`/api/auth`)
*Handles login and registration.*

| Method | Endpoint | Description | Body Parameters |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Create a new user account. | `name`, `email`, `password`, `role` |
| **POST** | `/login` | Log in and receive a Token. | `email`, `password` |
| **PUT** | `/profile` | Update user profile. | `address`, `password` |

---

## 2. Trucks (`/api/trucks`)
*Protected: Admin Only*

| Method | Endpoint | Description | Body Parameters |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Get list of all trucks. | - |
| **POST** | `/` | Add a new truck. | `plateNumber`, `capacity`, `driver` (ID) |
| **DELETE** | `/:id` | Remove a truck. | - |

---

## 3. Users (`/api/users`)
*Protected: Admin Only*

| Method | Endpoint | Description | Body Parameters |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Get list of all users. | - |

---

## 4. Complaints (`/api/complaints`)
*Handles resident reports.*

| Method | Endpoint | Description | Access | Body Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Submit a new complaint. | Resident | `description`, `locationName`, `imageUrl` |
| **GET** | `/` | Get all complaints. | Admin | - |
| **GET** | `/my` | Get my own complaints. | Resident | - |
| **PUT** | `/:id` | Update status (Resolver). | Admin | `status` ('resolved') |
| **DELETE** | `/:id` | Delete a complaint. | Admin | - |

---

## 5. Bins (`/api/bins`)
*Manage waste bins.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Get all bins with current status (Full/Empty). |

---

## 🛠️ How to Test APIs (Using Postman)

1.  **Install Postman**: Download it to test requests manually.
2.  **Login First**: 
    - Send a `POST` request to `http://localhost:5001/api/auth/login`.
    - Copy the `token` from the response.
3.  **Use the Token**:
    - For protected routes (like Trucks), go to the **Headers** tab in Postman.
    - Key: `Authorization`
    - Value: `Bearer PASTE_YOUR_TOKEN_HERE`

This ensures the server knows who you are!
