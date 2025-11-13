// index.js — minimal, Vercel-ready Express + MongoDB server

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// CORS (add your live frontend domains here)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://pay-bill-a10.web.app",
      "https://m10-pay-bill-server.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// --- Mongo client (single, reusable) ---
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let bills, myBills;

async function db() {
  if (bills && myBills) return;
  await client.connect();
  const database = client.db("utility_db");
  bills = database.collection("bills");
  myBills = database.collection("myBills");
  console.log("✅ MongoDB connected");
}

// --- Routes ---
app.get("/", (_, res) => res.send("✅ PayBill Server Running Successfully!"));

// List bills (optional: ?category=&limit=)
app.get("/bills", async (req, res) => {
  try {
    await db();
    const { category, limit } = req.query;
    const query = category
      ? { category: { $regex: new RegExp(`^${category}$`, "i") } }
      : {};
    let cursor = bills.find(query).sort({ date: -1 });
    if (limit) cursor = cursor.limit(parseInt(limit, 10) || 0);
    res.send(await cursor.toArray());
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Failed to fetch bills" });
  }
});

// Single bill
app.get("/bills/:id", async (req, res) => {
  try {
    await db();
    res.send(await bills.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Failed to fetch bill" });
  }
});

// Distinct categories
app.get("/categories", async (_req, res) => {
  try {
    await db();
    res.send(await bills.distinct("category"));
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Failed to fetch categories" });
  }
});

// Save a user bill (prevents duplicate by email+billsId)
app.post("/my-bills", async (req, res) => {
  try {
    await db();
    const { email, billsId } = req.body;
    if (!email || !billsId)
      return res.status(400).send({ message: "Missing email or billsId" });
    const exists = await myBills.findOne({ email, billsId });
    if (exists)
      return res.status(400).send({ message: "Already paid this bill" });
    const r = await myBills.insertOne({
      ...req.body,
      date: req.body?.date || new Date().toISOString(),
    });
    res.send({ insertedId: r.insertedId });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Failed to save user bill" });
  }
});

// Get user's bills (enriched with bill details so images/titles show)
app.get("/my-bills", async (req, res) => {
  try {
    await db();
    const { email, limit } = req.query;
    if (!email) return res.status(400).send({ message: "Missing email" });

    let cursor = myBills.find({ email }).sort({ date: -1 });
    if (limit) cursor = cursor.limit(parseInt(limit, 10) || 0);
    const rows = await cursor.toArray();

    const enriched = await Promise.all(
      rows.map(async (row) => {
        if (!row.billsId) return row;
        const src = await bills.findOne({ _id: new ObjectId(row.billsId) });
        return src ? { ...src, ...row } : row;
      })
    );
    res.send(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Failed to fetch user bills" });
  }
});

// Local dev only — Vercel uses the exported app below
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => console.log(`✅ Local: http://localhost:${port}`));
}

module.exports = app;
