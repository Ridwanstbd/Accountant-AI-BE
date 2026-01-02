const express = require("express");
const RoleController = require("../controllers/roleController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", RoleController.getRoles);

router.get("/:id", RoleController.getRoleById);

router.post("/", RoleController.createRole);

router.put("/:id", RoleController.updateRole);

router.delete("/:id", RoleController.deleteRole);

router.post("/:id/permissions", RoleController.assignPermission);
router.post("/:id/permissions/bulk", RoleController.assignMultiplePermissions);
router.delete(
  "/:id/permissions/:permissionId",
  RoleController.removePermission
);

module.exports = router;
