const dotenv = require("dotenv");
dotenv.config();

const connectToMongo = require("./db");
const express = require("express");
var cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
require("./config/passport-googleAuth-strategy");

const path = require("path");
const bodyParser = require("body-parser");

const app = express();
connectToMongo();

const PORT = process.env.PORT || 5000;

const mongoose = require("mongoose");

app.get("/api/db-health", (req, res) => {
  res.json({
    mongoState: mongoose.connection.readyState,
  });
});

app.use(bodyParser.json({ limit: "10mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://ngo-three-psi.vercel.app", // TODO: Add your Vercel Frontend URL here
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: "ssid",
    secret: process.env.SECRET_KEY,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-site in production
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("HELLO FROM API");
});

app.use("/user", require("./routes/user/User"));
app.use("/auth", require("./routes/user/Auth"));
app.use("/clubs", require("./routes/club/Club"));
app.use("/display", require("./routes/display/Display"));
// app.use("/payment", require("./routes/payment/Payment")); // Razorpay disabled
app.use("/product", require("./routes/shop/Products"));
app.use("/events", require("./routes/events/Event"));

// New enhanced features
app.use("/api/donations", require("./routes/donations/Donations")); // Blockchain donations
app.use("/api/chatbot", require("./routes/chatbot/Chatbot")); // AI Chatbot
app.use("/api/ai", require("./routes/ai/AiFeatures")); // New AI Features
app.use("/api/campaigns", require("./routes/campaigns/Campaigns")); // Campaigns
app.use("/api/trending", require("./routes/trending/Trending")); // Trending items

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API running locally on port ${PORT}`);
  });
}

module.exports = app;