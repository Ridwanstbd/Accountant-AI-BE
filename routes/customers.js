const express = require("express");
const customerController = require("../controllers/customerController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);
router.get("/", customerController.getAllCustomers);
router.post("/", customerController.createCustomer);
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
