const db = require("./db");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Add user (now accepts Role; defaults to 'student' when not provided)
exports.addUser = async (req, res) => {
  const { FirstName, MiddleName, LastName, Email, UserName, Password, Role } = req.body;
  const roleValue = Role === 'teacher' ? 'teacher' : 'student';
  const hashPassword = await bcrypt.hash(Password, 10);

  // Check if email already exists
  db.query(
    "SELECT UserID FROM users WHERE Email = ?",
    [Email],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }

      // Check if username already exists
      db.query(
        "SELECT UserID FROM users WHERE UserName = ?",
        [UserName],
        (err, results) => {
          if (err) return res.status(500).json({ message: err.message });
          if (results.length > 0) {
            return res.status(409).json({ message: "Username already in use" });
          }

          // If both email and username are unique, insert the user
          db.query(
            "INSERT INTO users (FirstName, MiddleName, LastName, Email, UserName, Password, Role) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [FirstName, MiddleName, LastName, Email, UserName, hashPassword, roleValue],
            (err) => {
              if (err) return res.status(500).json({ message: err.message });
              res.status(201).json({ message: "User Added" });
            }
          );
        }
      );
    }
  );
};


// View all users
exports.viewUsers = (req, res) => {
  db.query(
    "SELECT UserID, FirstName, MiddleName, LastName, Email, UserName, Role FROM users WHERE Role = 'student' ORDER BY UserID DESC",
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(200).json({ results });
    }
  );
}

// View individual user
exports.viewUser = (req, res) => {
    const { UID } = req.params;
    db.query(
        "SELECT UserID, FirstName, MiddleName, LastName, Email, UserName FROM users WHERE UserID = ?",
        [UID],
        (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            if (results.length === 0) return res.status(404).json({ message: "not found" });
            res.status(200).json(results[0]);
        }
    );
};

// Delete user
exports.deleteUser = (req, res) => {
    const { UID } = req.params;
    db.query(
        "DELETE FROM users WHERE UserID = ?",
        [UID],
        (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "user deleted successfully" });
        }
    );
}

// Update user
exports.updateUser = async (req, res) => {
    const { UID } = req.params;
    const { FirstName, MiddleName, LastName, UserName, Email, Password } = req.body;
    const hashPassword = Password ? await bcrypt.hash(Password, 10) : null;

    db.query(
        "UPDATE users SET FirstName=?, MiddleName=?, LastName=?, Email=?, UserName=?, Password=COALESCE(?,Password) WHERE UserID=?",
        [FirstName, MiddleName, LastName, Email, UserName, hashPassword, UID],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "User updated successfully" });
        }
    );
}

// Login user - returns token AND role
exports.loginUser = (req, res) => {
  const { UserName, Password } = req.body;

  db.query(
    "SELECT * FROM users WHERE UserName = ?",
    [UserName],
    async (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length === 0) return res.status(401).json({ message: "Invalid Username" });

      const user = results[0];
      const isMatch = await bcrypt.compare(Password, user.Password);
      if (!isMatch) return res.status(401).json({ message: "Invalid Password" });

      // include role in token payload
      const payload = { UserID: user.UserID, role: user.Role || 'student' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.status(200).json({
        message: "Login Successful",
        token,
        role: user.Role || 'student',
        userId: user.UserID,
        userName: user.UserName
      });
    }
  );
};


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  db.query("SELECT UserID FROM users WHERE Email = ?", [email], async (err, results) => {
        if (results && results.length > 0) {
            const userId = results[0].UserID;
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour
            db.query(
                "INSERT INTO passwordresettokens (userId, userType, token, expiresAt) VALUES (?, 'user', ?, ?)",
                [userId, token, expiresAt],
                async (err2) => {
                    if (!err2) {
                        // Send email
                        const transporter = nodemailer.createTransport({
                            service: "gmail",
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            },
                        });
                        const resetLink = `http://localhost:5173/resetpassword?token=${token}&type=user`;
                        await transporter.sendMail({
                            to: email,
                            subject: "Password Reset",
                            text: `Click this link to reset your password: ${resetLink}`,
                        });
                    }
                }
            );
        }
        // Always respond with success for security
        res.json({ message: "If this email exists, a password reset link has been sent." });
    });
}

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  db.query(
    "SELECT * FROM passwordresettokens WHERE token = ? AND userType = 'user' AND expiresAt > NOW()",
    [token],
    async (err, results) => {
            if (err || results.length === 0) return res.status(400).json({ message: "Invalid or expired token" });
            const userId = results[0].userId;
            const hashPassword = await bcrypt.hash(newPassword, 10);
            db.query("UPDATE users SET Password = ? WHERE UserID = ?", [hashPassword, userId]);
            db.query("DELETE FROM passwordresettokens WHERE token = ?", [token]);
            res.json({ message: "Password has been reset." });
        }
    );
}