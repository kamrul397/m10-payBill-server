require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://pay-bill-a10.web.app",
      "https://pay-bill-a10.firebaseapp.com",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Use correct env name:
const uri = process.env.MONGO_URI;

// ✅ Create client only once (global cache for Vercel)
let client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, bills, myBills;

// ✅ Connect only once (fix for Vercel cold starts)
async function connectDB() {
  if (db) return; // Already connected
  await client.connect();
  db = client.db("utility_db");
  bills = db.collection("bills");
  myBills = db.collection("myBills");
  console.log("✅ MongoDB Connected Successfully!");
}

// ✅ ROUTES
app.get("/", async (req, res) => {
  await connectDB();
  res.send("Server Running ✅");
});

app.get("/bills", async (req, res) => {
  await connectDB();
  const { category, limit } = req.query;

  let query = {};
  if (category?.trim()) {
    query.category = { $regex: `^${category}$`, $options: "i" };
  }

  let cursor = bills.find(query).sort({ date: -1 });
  if (limit) cursor = cursor.limit(Number(limit));

  res.send(await cursor.toArray());
});

app.get("/bills/:id", async (req, res) => {
  await connectDB();
  const one = await bills.findOne({ _id: new ObjectId(req.params.id) });
  res.send(one);
});

app.post("/my-bills", async (req, res) => {
  await connectDB();
  const { email, billsId } = req.body;

  const exists = await myBills.findOne({ email, billsId });
  if (exists)
    return res.status(400).send({ message: "Already paid this bill" });

  const result = await myBills.insertOne(req.body);
  res.send({ insertedId: result.insertedId });
});

app.get("/my-bills", async (req, res) => {
  await connectDB();
  const { email } = req.query;
  const data = await myBills.find({ email }).sort({ date: -1 }).toArray();
  res.send(data);
});

app.patch("/my-bills/:id", async (req, res) => {
  await connectDB();
  const r = await myBills.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.send(r);
});

app.delete("/my-bills/:id", async (req, res) => {
  await connectDB();
  const r = await myBills.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(r);
});

// ✅ Local mode only
if (!process.env.VERCEL) {
  app.listen(port, () =>
    console.log(`✅ Server running locally at http://localhost:${port}`)
  );
}

module.exports = app; // ✅ Required for Vercel deployment
