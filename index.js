// ======== IMPORTS ========
require("dotenv").config(); // load .env (MONGO_URI, PORT)
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// ======== APP CONFIG ========
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev (Vite)
      "https://pay-bill-a10.web.app", // your Firebase frontend
      // add your final Vercel frontend domain if you have one:
      // "https://your-frontend.vercel.app",
    ],
    credentials: true,
  })
);

// ======== MONGO CONNECTION ========
const uri = process.env.MONGO_URI; // from .env

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, bills, myBills;

async function connectDB() {
  if (db) return db; // reuse if already connected
  await client.connect();
  db = client.db("utility_db");
  bills = db.collection("bills");
  myBills = db.collection("myBills");
  console.log("✅ MongoDB Connected Successfully!");
  return db;
}

// ======== ROUTES ========

// 🔹 Root test route
app.get("/", (req, res) => {
  res.send("✅ PayBill Server Running Successfully!");
});

// 🔹 Fetch all or filtered bills
app.get("/bills", async (req, res) => {
  try {
    await connectDB();
    const { category, limit } = req.query;
    const query = {};

    if (category) {
      // case-insensitive exact match
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    let cursor = bills.find(query).sort({ date: -1 });
    if (limit) cursor = cursor.limit(parseInt(limit, 10));

    const result = await cursor.toArray();
    res.send(result);
  } catch (err) {
    console.error("Error fetching bills:", err);
    res.status(500).send({ message: "Failed to fetch bills" });
  }
});

// 🔹 Fetch a single bill by ID
app.get("/bills/:id", async (req, res) => {
  try {
    await connectDB();
    const one = await bills.findOne({ _id: new ObjectId(req.params.id) });
    res.send(one);
  } catch (err) {
    console.error("Error fetching bill:", err);
    res.status(500).send({ message: "Failed to fetch bill" });
  }
});

// 🔹 Fetch distinct categories (for Home.jsx public categories)
app.get("/categories", async (req, res) => {
  try {
    await connectDB();
    const categories = await bills.distinct("category");
    res.send(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send({ message: "Failed to fetch categories" });
  }
});

// 🔹 Add new user payment (prevent duplicates)
//    (Option 2 from earlier: simple insert; you can also enrich here if you prefer)
app.post("/my-bills", async (req, res) => {
  try {
    await connectDB();
    const { email, billsId } = req.body;

    if (!email || !billsId) {
      return res.status(400).send({ message: "Missing email or billsId" });
    }

    const exists = await myBills.findOne({ email, billsId });
    if (exists) {
      return res.status(400).send({ message: "Already paid this bill" });
    }

    const result = await myBills.insertOne({
      ...req.body,
      date: req.body?.date || new Date().toISOString(),
    });

    res.send({ insertedId: result.insertedId });
  } catch (err) {
    console.error("Error saving user bill:", err);
    res.status(500).send({ message: "Failed to save user bill" });
  }
});

// 🔹 Fetch user-specific bills (ENRICHED so images/title/category show)
app.get("/my-bills", async (req, res) => {
  try {
    await connectDB();
    const { email, limit } = req.query;
    if (!email) return res.status(400).send({ message: "Missing email" });

    let cursor = myBills.find({ email }).sort({ date: -1 });
    if (limit) cursor = cursor.limit(parseInt(limit, 10));

    const rows = await cursor.toArray();

    // Join with 'bills' by billsId so UI can use bill.image/title/category
    const enriched = await Promise.all(
      rows.map(async (row) => {
        if (!row.billsId) return row; // fallback, if malformed
        const billDoc = await bills.findOne({ _id: new ObjectId(row.billsId) });
        // Merge: bill fields first (title/image/category/location/amount), then user record (status, etc.)
        return billDoc ? { ...billDoc, ...row } : row;
      })
    );

    res.send(enriched);
  } catch (err) {
    console.error("Error fetching user bills:", err);
    res.status(500).send({ message: "Failed to fetch user bills" });
  }
});

// 🔹 Update a specific user bill
app.patch("/my-bills/:id", async (req, res) => {
  try {
    await connectDB();
    const r = await myBills.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(r);
  } catch (err) {
    console.error("Error updating user bill:", err);
    res.status(500).send({ message: "Failed to update user bill" });
  }
});

// 🔹 Delete a specific user bill
app.delete("/my-bills/:id", async (req, res) => {
  try {
    await connectDB();
    const r = await myBills.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(r);
  } catch (err) {
    console.error("Error deleting user bill:", err);
    res.status(500).send({ message: "Failed to delete user bill" });
  }
});

// ======== ERROR HANDLER ========
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ======== START SERVER ========
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
module.exports = app;
