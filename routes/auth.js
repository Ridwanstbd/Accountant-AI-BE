// D:\BISNIS\dropship\Accountant-AI-BE\routes\auth.js
const express = require("express");
const AuthController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/refresh-token", AuthController.refreshToken);

// Protected routes
router.use(verifyToken);
router.get("/profile", AuthController.getProfile);
router.post("/join-business", AuthController.joinBusiness);
router.post("/change-password", AuthController.changePassword);
router.post("/logout", AuthController.logout);

module.exports = router;
