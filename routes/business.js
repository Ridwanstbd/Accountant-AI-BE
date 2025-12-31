const express = require("express");
const BusinessController = require("../controllers/businessController");
const validate = require("../middlewares/validate");
const {
  createBusinessSchema,
  updateBusinessSchema,
  assignBusinessRoleSchema,
} = require("../validators/businessValidator");

const {
  verifyToken,
  requirePermission,
  requireBusinessPermission,
  requireBusinessMembership,
} = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/my-businesses", BusinessController.getUserBusinesses);

router.post(
  "/",
  requirePermission("business_create"),
  validate(createBusinessSchema),
  BusinessController.createBusiness
);

router.get(
  "/:businessId",
  requireBusinessMembership,
  BusinessController.getBusinessById
);

router.put(
  "/:businessId",
  requireBusinessPermission("business_update"),
  validate(updateBusinessSchema),
  BusinessController.updateBusiness
);

router.get(
  "/:businessId/users",
  requireBusinessPermission("business_manage_users"),
  BusinessController.getBusinessUsers
);

router.post(
  "/:businessId/users",
  requireBusinessPermission("business_manage_users"),
  validate(assignBusinessRoleSchema),
  BusinessController.assignUserRole
);

router.delete(
  "/:businessId/users/:userId",
  requireBusinessPermission("business_manage_users"),
  BusinessController.removeUser
);

module.exports = router;
