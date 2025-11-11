require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected Successfully!");

    const db = client.db("utility_db");
    const bills = db.collection("bills");
    const myBills = db.collection("myBills");

    // Test route
    app.get("/", (req, res) => {
      res.send("Server Running ✅");
    });

    app.get("/bills", async (req, res) => {
      const { category, limit } = req.query;

      let query = {};
      if (category && category.trim()) {
        const cleaned = category.trim();
        // ✅ Case-insensitive + exact match
        query.category = { $regex: `^${cleaned}$`, $options: "i" };
      }

      let cursor = bills.find(query).sort({ date: -1 });

      if (limit) {
        cursor = cursor.limit(parseInt(limit));
      }

      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/bills/:id", async (req, res) => {
      const one = await bills.findOne({ _id: new ObjectId(req.params.id) });
      res.send(one);
    });

    // POST /my-bills
    app.post("/my-bills", async (req, res) => {
      const { email, billsId } = req.body;

      // ✅ Check if this user already paid this same bill
      const exists = await myBills.findOne({ email, billsId });

      if (exists) {
        return res.status(400).send({ message: "Already paid this bill" });
      }

      // Otherwise insert new payment
      const result = await myBills.insertOne(req.body);
      res.send({ insertedId: result.insertedId });
    });

    app.get("/my-bills", async (req, res) => {
      const { email } = req.query;
      const data = await myBills.find({ email }).sort({ date: -1 }).toArray();
      res.send(data);
    });

    app.patch("/my-bills/:id", async (req, res) => {
      const r = await myBills.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.send(r);
    });

    app.delete("/my-bills/:id", async (req, res) => {
      const r = await myBills.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(r);
    });
  } catch (err) {
    console.log(err);
  }
}

run();

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
}

module.exports = app; // ✅ Add this line for Vercel
