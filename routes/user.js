const express = require("express");
const UserController = require("../controllers/userController");
const {
  verifyToken,
  requirePermission,
  requireSuperAdmin,
} = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Profile management
router.put("/profile", UserController.updateProfile);

// Get users (require user_view permission)
router.get("/", requirePermission("user_view"), UserController.getUsers);

// Get user by ID (require user_view permission)
router.get("/:id", requirePermission("user_view"), UserController.getUserById);

// Update user (require user_update permission)
router.put("/:id", requirePermission("user_update"), UserController.updateUser);

// Role management (require user_manage_roles permission)
router.post(
  "/:id/roles",
  requirePermission("user_manage_roles"),
  UserController.assignRole
);
router.delete(
  "/:id/roles/:roleId",
  requirePermission("user_manage_roles"),
  UserController.removeRole
);

// User activation/deactivation (require superadmin)
router.patch(
  "/:id/deactivate",
  requireSuperAdmin,
  UserController.deactivateUser
);
router.patch("/:id/activate", requireSuperAdmin, UserController.activateUser);

module.exports = router;
