require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendRegistrationEmail(job, nome, email) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587, // Port 587 for TLS
      secure: false, // Use TLS with port 587
      auth: {
        user: "jobboard321@outlook.com",
        pass: "Jobboard123",
      },
      tls: {
        ciphers: "SSLv3",
      },
    });

    let info = await transporter.sendMail({
      from: "jobboard321@outlook.com",
      to: `${email}`,
      subject: "Application",
      html: `
        <h1>Hello ${nome},</h1>
        <p>Your application as ${job} has been recieved. We will review your resume and get back to you!</p>
      `,
    });

    console.log("Email sent: " + info.response);
    console.log("Message ID: " + info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendRegistrationEmail };
