# ⚡ Utility Bill Management System — Server (Backend API)

This is the **backend REST API** for the Utility Bill Management System.  
Built using **Node.js**, **Express.js**, and **MongoDB Atlas**, this API manages bills, payments, and user-specific records.

---

## 🌍 Live API Base URL
> https://m10-paybill-server.onrender.com/
**Example:**
> 
---

## 🧰 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB Atlas**
- **CORS Enabled**
- **Environment Variables via dotenv**
- **RESTful API Architecture**

---

## 📡 API Endpoints

### 🔹 **Bills**
| Method | Endpoint      | Description                                |
| ------ | ------------- | ------------------------------------------ |
| GET    | `/bills`      | Fetch all bills (with optional category)   |
| GET    | `/bills/:id`  | Fetch full details of a single bill        |

---

### 🔹 **User Payments**
| Method | Endpoint                        | Description                                 |
| ------ | -------------------------------- | ------------------------------------------- |
| POST   | `/my-bills`                     | Pay a bill (prevents duplicate payments)    |
| GET    | `/my-bills?email=user@mail.com` | Get all bills paid by a specific user       |
| PATCH  | `/my-bills/:id`                 | Update a user’s payment entry               |
| DELETE | `/my-bills/:id`                 | Delete a payment entry                      |

---

## 🔐 Environment Variables

Create a `.env` file with:


