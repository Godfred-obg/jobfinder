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

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: false }));

app.use("/api/product", product);

app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  // res.send(req.file)
  const pdf = req.file.filename;
  const job = req.body.job;
  const employee = req.body.user;
  console.log(job, employee);
  try {
    const newfile = await pool.query(
      "INSERT INTO files (pdf) VALUES($1) RETURNING *",
      [pdf]
    );
    const lastid = await pool.query("SELECT MAX(ID) as id FROM files");

    const application = await pool.query(
      "INSERT INTO application (job, employee, file) VALUES($1, $2, $3) RETURNING *",
      [job, employee, lastid.rows[0].id]
    );

    const getjob = await pool.query(
      "SELECT nome_job FROM job where job_id=$1",
      [job]
    );
    const getemployee = await pool.query(
      "SELECT nome, email FROM utente where utente_id=$1",
      [employee]
    );

    sendRegistrationEmail(
      getjob.rows[0].nome_job,
      getemployee.rows[0].nome,
      getemployee.rows[0].email
    );
    console.log(getemployee.rows[0].email);

    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: "error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
