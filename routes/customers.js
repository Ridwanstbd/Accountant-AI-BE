const express = require("express");
const customerController = require("../controllers/customerController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} = require("../validators/customerValidator");

const router = express.Router();

router.use(verifyToken);

router.get(
  "/",
  validate(customerQuerySchema, "query"),
  customerController.getAllCustomers
);

router.post(
  "/",
  validate(createCustomerSchema, "body"),
  customerController.createCustomer
);

router.get("/:id", customerController.getCustomerById);

router.put(
  "/:id",
  validate(updateCustomerSchema, "body"),
  customerController.updateCustomer
);

router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
