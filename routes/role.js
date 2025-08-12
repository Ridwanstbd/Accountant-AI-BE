const express = require("express");
const RoleController = require("../controllers/roleController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get roles (require role_view permission)
router.get("/", requirePermission("role_view"), RoleController.getRoles);

// Get role by ID (require role_view permission)
router.get("/:id", requirePermission("role_view"), RoleController.getRoleById);

// Create role (require role_create permission)
router.post("/", requirePermission("role_create"), RoleController.createRole);

// Update role (require role_update permission)
router.put("/:id", requirePermission("role_update"), RoleController.updateRole);

// Delete role (require role_delete permission)
router.delete(
  "/:id",
  requirePermission("role_delete"),
  RoleController.deleteRole
);

// Permission management (require role_assign_permissions permission)
router.post(
  "/:id/permissions",
  requirePermission("role_assign_permissions"),
  RoleController.assignPermission
);
router.post(
  "/:id/permissions/bulk",
  requirePermission("role_assign_permissions"),
  RoleController.assignMultiplePermissions
);
router.delete(
  "/:id/permissions/:permissionId",
  requirePermission("role_assign_permissions"),
  RoleController.removePermission
);

module.exports = router;
