const express = require("express");
const app = express();
const product = require("./api/product");
const cors = require("cors");

app.use(express.json({ extended: false }));
app.use(
  cors({
    origin: "*", // Replace with the origin of your React app
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/product", product);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
