const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const trackingRoutes = require("./routes/tracking");
const cors = require('cors')

dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT || 3002;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Routes
app.use("/tracking", trackingRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Tracking App");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
