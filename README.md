---

# ✅ **SERVER — `server/README.md`**

```markdown
# Utility Bill Management System (Server)

This is the **backend REST API** for the Utility Bill Management System.  
It is built using **Node.js**, **Express**, and **MongoDB Atlas**.

---

## 🌍 Live API Base URL

_Add after deployment_  
Example:

---

## 🧰 Technologies Used

- Node.js
- Express.js
- MongoDB Atlas
- CORS Enabled

---

## 📦 Endpoints

| Method | Endpoint                        | Description                                |
| ------ | ------------------------------- | ------------------------------------------ |
| GET    | `/bills`                        | Get all bills (optional category filter)   |
| GET    | `/bills/:id`                    | Get single bill details                    |
| POST   | `/my-bills`                     | Pay a bill _(prevents duplicate payments)_ |
| GET    | `/my-bills?email=user@mail.com` | Get bills paid by this user only           |
| PATCH  | `/my-bills/:id`                 | Update a payment entry                     |
| DELETE | `/my-bills/:id`                 | Delete a payment entry                     |

---
