const express = require("express");
const AuthController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/auth");
const {
  inviteStaffSchema,
  changePasswordSchema,
  joinBusinessSchema,
  resetPasswordSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} = require("../validators/authValidator");
const validate = require("../middlewares/validate");
const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/invite-staff",
  validate(inviteStaffSchema),
  AuthController.inviteStaff
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword
);
router.post("/refresh-token", AuthController.refreshToken);

// Protected routes
router.use(verifyToken);
router.get("/profile", AuthController.getProfile);
router.post(
  "/join-business",
  validate(joinBusinessSchema),
  AuthController.joinBusiness
);
router.post(
  "/change-password",
  validate(changePasswordSchema),
  AuthController.changePassword
);
router.post("/logout", AuthController.logout);

module.exports = router;
