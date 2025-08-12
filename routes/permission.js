const express = require("express");
const PermissionController = require("../controllers/permissionController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get permissions (require permission_view)
router.get(
  "/",
  requirePermission("permission_view"),
  PermissionController.getPermissions
);

// Get permissions grouped by module (require permission_view)
router.get(
  "/modules",
  requirePermission("permission_view"),
  PermissionController.getPermissionsByModule
);

// Get permission by ID (require permission_view)
router.get(
  "/:id",
  requirePermission("permission_view"),
  PermissionController.getPermissionById
);

// Create permission (require permission_create)
router.post(
  "/",
  requirePermission("permission_create"),
  PermissionController.createPermission
);

// Create multiple permissions (require permission_create)
router.post(
  "/bulk",
  requirePermission("permission_create"),
  PermissionController.createMultiplePermissions
);

// Update permission (require permission_update)
router.put(
  "/:id",
  requirePermission("permission_update"),
  PermissionController.updatePermission
);

// Delete permission (require permission_delete)
router.delete(
  "/:id",
  requirePermission("permission_delete"),
  PermissionController.deletePermission
);

module.exports = router;
