const express = require("express");
const path = require("path");
const sendEmail = require("../sendEmail"); // Fixed: Go up one level from /api
const dotenv = require("dotenv");

// Fixed: Load config from project root
dotenv.config({ path: path.join(__dirname, "../config.env") });

const app = express();

// Fixed: Set views directory from /api to project root
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Fixed: Serve static files from project root
app.use(express.static(path.join(__dirname, "../public")));

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Basic input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
}

// Home page GET /
app.get("/", (req, res) => {
  res.render("index", {
    title: "דרך לחיים - מיזם חינוכי-ספורטיבי",
    currentYear: new Date().getFullYear(),
    success: req.query.success === "true",
    error: req.query.error || null,
  });
});

// Contact form submit POST /contact
app.post("/contact", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.redirect(
        "/?error=" + encodeURIComponent("אנא מלאו את כל השדות הנדרשים")
      );
    }

    if (!isValidEmail(email)) {
      return res.redirect(
        "/?error=" + encodeURIComponent("אנא הזינו כתובת אימייל תקינה")
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      fullName: sanitizeInput(fullName),
      email: sanitizeInput(email),
      phone: phone ? sanitizeInput(phone) : "",
      message: sanitizeInput(message),
    };

    // Send email using your sendEmail utility
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `פניה חדשה מאתר - הודעה מ${sanitizedData.fullName}`,
      text: `
פניה חדשה מהאתר דרך לחיים

שם מלא: ${sanitizedData.fullName}
אימייל: ${sanitizedData.email}
טלפון: ${sanitizedData.phone || "לא סופק"}

הודעה:
${sanitizedData.message}

---
נשלח בתאריך: ${new Date().toLocaleString()}
      `,
      html: `
        <h2>פניה חדשה מהאתר דרך לחיים</h2>
        <p><strong>שם מלא:</strong> ${sanitizedData.fullName}</p>
        <p><strong>אימייל:</strong> ${sanitizedData.email}</p>
        <p><strong>טלפון:</strong> ${sanitizedData.phone || "לא סופק"}</p>
        <h3>הודעה:</h3>
        <p>${sanitizedData.message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>נשלח בתאריך: ${new Date().toLocaleString()}</small></p>
      `,
    });

    console.log(`Email sent successfully from ${sanitizedData.email}`);
    res.redirect("/?success=true");
  } catch (err) {
    console.error("Failed to send email:", err);
    res.redirect(
      "/?error=" +
        encodeURIComponent("שגיאה בשליחת המייל. אנא נסו שוב מאוחר יותר.")
    );
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("עמוד לא נמצא - 404");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("שגיאת שרת - 500");
});

module.exports = app;
