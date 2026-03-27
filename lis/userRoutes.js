const express = require("express");
const { addUser, viewUsers, viewUser, deleteUser, updateUser, loginUser, forgotPassword, resetPassword } = require("./userController");
const authMiddleware = require("./authMiddleware");
const { requireTeacher } = require("./roleMiddleware");

const router = express.Router();

router.post("/adduser", addUser);

router.get("/user/:UID", viewUser);
router.get("/viewusers", authMiddleware, requireTeacher, viewUsers);
router.get("/viewuser/:UID", authMiddleware, viewUser);
router.delete("/deleteuser/:UID", authMiddleware, deleteUser);
router.put("/updateuser/:UID", authMiddleware, updateUser);
router.post("/loginuser", loginUser);
// Password reset endpoints
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", resetPassword);

module.exports = router;