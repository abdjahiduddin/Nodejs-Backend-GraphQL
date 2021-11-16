const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config();

// Import Routes
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const MONGODB_URI = process.env.MONGODB_URI;
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const app = express();

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use((req, res, next) => {
  console.log(req.method + " " + req.path + " - " + req.hostname);
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// Error Handling
app.use((error, req, res, next) => {
  console.log("Generated error from middlleware error handling...");
  console.log(error);
  const code = error.statusCode || 500;
  const message = error.message;
  const data = error.data || "";
  res.status(code).json({
    message: message,
    data: data,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((connect) => {
    console.log("Connected to database");
    console.log("Listen on port 8080");

    const server = app.listen(8080);

    const io = require("./socket").init(server)

    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));
