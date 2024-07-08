const express = require("express");
const app = express();
const product = require("./api/product");

const cors = require("cors");
//app.use(express.json({ extended: false }));
//require("dotenv").config();
const pool = require("../db");
//const { hashPassword, comparePassword } = require("/auth");
//const cookieParser = require("cookie-parser");
//const jwt = require("jsonwebtoken");
//const fs = require("fs");
//const { sendRegistrationEmail } = require("/email");

//app.use(express.json({ extended: false }));
app.use(
  cors({
    origin: "*", // Replace with the origin of your React app
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/*const isNullOrEmpty = (value) =>
  !value || value.toLowerCase() === "undefined" || value === "";

//app.use(express.json()); //req.body
app.use(cookieParser());
app.use("/files", express.static("files"));
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });*/

app.use(express.urlencoded({ extended: false }));

app.use("/api/product", product);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
