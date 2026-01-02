// D:\BISNIS\dropship\Accountant-AI-BE\routes\user.js
const express = require("express");
const UserController = require("../controllers/userController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);

router.put("/profile", UserController.updateProfile);

router.get("/", UserController.getUsers);

router.get("/:id", UserController.getUserById);

router.put("/:id", UserController.updateUser);

router.post("/:id/roles", UserController.assignRole);
router.delete("/:id/roles/:roleId", UserController.removeRole);

router.patch("/:id/deactivate", UserController.deactivateUser);
router.patch("/:id/activate", UserController.activateUser);

module.exports = router;
