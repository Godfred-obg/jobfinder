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

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.json({
        error: "email is required",
      });
    }
    if (!password || password.length < 6) {
      return res.json({
        error: "password is incorrect",
      });
    }
    const user = await pool.query(
      `
      SELECT utente_id, email, password, nome, cognome, stato, company_name
      FROM utente
      WHERE email = $1
    `,
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({
        error: "No user found",
      });
    }

    const match = await comparePassword(password, user.rows[0].password);

    if (match) {
      console.log("Password matched. Creating token...");
      const token = jwt.sign(
        {
          email: user.rows[0].email,
          nome: user.rows[0].nome,
          stato: user.rows[0].stato,
          id: user.rows[0].utente_id,
          company: user.rows[0].company_name,
        },
        process.env.JWT_SECRET
      );
      res.json(token);

      console.log("Token created:", token);
    } else {
      res.json("passwords do not match");
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, surname, email, password, stato, company } = req.body;
    if (!name) {
      return res.json({
        error: "name is required",
      });
    }
    if (!surname) {
      return res.json({
        error: "surname is required",
      });
    }
    if (!email) {
      return res.json({
        error: "email is required",
      });
    }
    if (!stato) {
      return res.json({
        error: "stato is required",
      });
    }
    if (!password || password.length < 6) {
      return res.json({
        error: "password is required and should be at least 6 characters long",
      });
    }
    if (stato === "employer" && !company) {
      return res.json({
        error: "Company name is required",
      });
    }
    const exist = await pool.query(
      `
    SELECT EXISTS (
      SELECT 1
      FROM utente
      WHERE email = $1
    );
  `,
      [email]
    );
    if (exist.rows[0].exists) {
      return res.json({
        error: "email is taken",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUtente = await pool.query(
      "INSERT INTO utente (nome, cognome, email, password, stato, company_name) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, surname, email, hashedPassword, stato, company]
    );

    res.json(newUtente.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/postjob", async (req, res) => {
  try {
    const { position, category, location, description, employer, company } =
      req.body;
    if (!position) {
      return res.json({
        error: "position is required",
      });
    }
    if (!category) {
      return res.json({
        error: "category is required",
      });
    }
    if (!location) {
      return res.json({
        error: "location is required",
      });
    }
    if (!description) {
      return res.json({
        error: "description is required",
      });
    }

    const newJob = await pool.query(
      `
    INSERT INTO JOB (nome_job, descrizione, location, category, employer, company_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `,
      [position, description, location, category, employer, company]
    );

    res.json(newJob.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//get all todos

app.get("/job", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * FROM job");
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/post/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const allTodos = await pool.query(
      "SELECT job_id, nome_job as nome, location, job_status FROM job where employer = $1",
      [id]
    );
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/closejob/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const allTodos = await pool.query(
      `UPDATE job SET job_status = 'close' WHERE job_id  = $1`,
      [id]
    );
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/applied/:id", async (req, res) => {
  try {
    var user = req.params.id;
    const applied = await pool.query(
      "SELECT j.nome_job as nome, j.location as location FROM application JOIN job as j on (j.job_id=job) where employee = $1",
      [user]
    );
    res.json(applied.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//get a todo

app.get("/job/filter/:nome/:cat?/:loc?", async (req, res) => {
  try {
    let filteredJobs;
    var per = req.params.nome;
    per = `%${per}%`;
    const cat = req.params.cat;
    const loc = req.params.loc;
    console.log(per);
    console.log(cat);
    console.log(cat);
    console.log(req.originalUrl);
    if (isNullOrEmpty(cat) && isNullOrEmpty(loc)) {
      filteredJobs = await pool.query(
        "SELECT * FROM job WHERE nome_job ILIKE $1;",
        [per]
      );
    } else if (isNullOrEmpty(cat) && !isNullOrEmpty(loc)) {
      filteredJobs = await pool.query(
        "SELECT * FROM job WHERE nome_job ILIKE $1 AND location = $2;",
        [per, loc]
      );
    } else if (!isNullOrEmpty(cat) && isNullOrEmpty(loc)) {
      filteredJobs = await pool.query(
        "SELECT * FROM job WHERE nome_job ILIKE $1 AND category = $2;",
        [per, cat]
      );
    } else {
      filteredJobs = await pool.query(
        "SELECT * FROM job WHERE nome_job ILIKE $1 AND category = $2 AND location = $3;",
        [per, cat, loc]
      );
    }

    res.json(filteredJobs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/details/:id/:userid", async (req, res) => {
  try {
    const id = req.params.id;
    const userid = req.params.userid;
    const job = await pool.query(
      `
        SELECT job_status, nome_job, location, company_name, descrizione
        FROM job
        WHERE job_id = $1
      `,
      [id]
    );

    if (job.rows.length === 0)
      return res.status(404).json({ error: "Job not found" });

    const exist = await pool.query(
      `
    SELECT EXISTS (
      SELECT 1
      FROM application
      WHERE employee = $1 AND job = $2
    );
  `,
      [userid, id]
    );

    res.json({
      ...job.rows[0],
      applicationExists: exist.rows[0].exists,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/candidates/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const job = await pool.query(
      `
        SELECT nome_job, location, u.nome as nome, u.cognome, f.pdf as file
        FROM job
        JOIN application AS app ON (app.job=job_id)
        JOIN files AS f ON (f.id=app.file)
        JOIN utente AS u ON (u.utente_id=app.employee)
        WHERE job_id = $1
      `,
      [id]
    );

    res.json(job.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
