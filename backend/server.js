const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://donation-platform-khaki.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log("🔗 Connecting to MongoDB at:", process.env.MONGODB_URI);
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
};

mongoose
  .connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("📦 Database URI:", process.env.MONGODB_URI);

    // Start server only after DB connection is established
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "❌ MongoDB connection failed:",
      err && err.message ? err.message : err,
    );
    if (err && err.reason) console.error("Cause:", err.reason);
    console.error(
      "\nPossible causes: incorrect URI, network access (Atlas IP whitelist), or credentials.",
    );
    process.exit(1);
  });

// Import routes
const donationRoutes = require("./routes/donations");
const charityRoutes = require("./routes/charities");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard"); // ← ADD

// Routes
app.use("/api/donations", donationRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes); // ← ADD

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// NOTE: server is started after successful DB connection above.
