// D:\BISNIS\dropship\Accountant-AI-BE\routes\business.js
const express = require("express");
const BusinessController = require("../controllers/businessController");
const {
  verifyToken,
  requirePermission,
  requireBusinessPermission,
  requireBusinessMembership,
} = require("../middlewares/auth");

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user's businesses
router.get("/my-businesses", BusinessController.getUserBusinesses);

// Create business (require global permission)
router.post(
  "/",
  requirePermission("business_create"),
  BusinessController.createBusiness
);

// Business-specific routes
router.get(
  "/:businessId",
  requireBusinessMembership,
  BusinessController.getBusinessById
);
router.put(
  "/:businessId",
  requireBusinessPermission("business_update"),
  BusinessController.updateBusiness
);

// Business user management
router.get(
  "/:businessId/users",
  requireBusinessPermission("business_manage_users"),
  BusinessController.getBusinessUsers
);
router.post(
  "/:businessId/users",
  requireBusinessPermission("business_manage_users"),
  BusinessController.assignUserRole
);
router.delete(
  "/:businessId/users/:userId",
  requireBusinessPermission("business_manage_users"),
  BusinessController.removeUser
);

module.exports = router;
