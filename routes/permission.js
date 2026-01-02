// D:\BISNIS\dropship\Accountant-AI-BE\routes\permission.js
const express = require("express");
const PermissionController = require("../controllers/permissionController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", PermissionController.getPermissions);

router.get("/modules", PermissionController.getPermissionsByModule);

router.get("/:id", PermissionController.getPermissionById);

router.post("/", PermissionController.createPermission);

router.post("/bulk", PermissionController.createMultiplePermissions);

router.put("/:id", PermissionController.updatePermission);

router.delete("/:id", PermissionController.deletePermission);

module.exports = router;
