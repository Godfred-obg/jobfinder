const express = require("express");
const app = express();
const product = require("./api/product");
const cors = require("cors");

require("dotenv").config();
const pool = require("./db");
const { hashPassword, comparePassword } = require("./auth");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { sendRegistrationEmail } = require("./email");

app.use(express.json({ extended: false }));
app.use(
  cors({
    origin: "*", // Replace with the origin of your React app
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const isNullOrEmpty = (value) =>
  !value || value.toLowerCase() === "undefined" || value === "";

//app.use(express.json()); //req.body


app.use(express.urlencoded({ extended: false }));

app.use("/api/product", product);



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
