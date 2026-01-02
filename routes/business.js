const express = require("express");
const BusinessController = require("../controllers/businessController");
const validate = require("../middlewares/validate");
const {
  createBusinessSchema,
  updateBusinessSchema,
  assignBusinessRoleSchema,
} = require("../validators/businessValidator");

const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/my-businesses", BusinessController.getUserBusinesses);

router.post(
  "/",
  validate(createBusinessSchema),
  BusinessController.createBusiness
);

router.get("/:businessId", BusinessController.getBusinessById);

router.put(
  "/:businessId",
  validate(updateBusinessSchema),
  BusinessController.updateBusiness
);

router.get("/:businessId/users", BusinessController.getBusinessUsers);

router.post(
  "/:businessId/users",
  validate(assignBusinessRoleSchema),
  BusinessController.assignUserRole
);

router.delete("/:businessId/users/:userId", BusinessController.removeUser);

module.exports = router;
