const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB URI
const uri =
  "mongodb+srv://kamrulislam25262800_db_user:J6dw4LqbzDdgamwS@paybillcluster.6mhzwpy.mongodb.net/?retryWrites=true&w=majority";

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

    // Example route to fetch bills
    app.get("/bills", async (req, res) => {
      const result = await bills.find().toArray();
      res.send(result);
    });
  } catch (err) {
    console.log(err);
  }
}

run();

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
