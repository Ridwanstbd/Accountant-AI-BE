const express = require("express");
const accountController = require("../controllers/accountController");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.use(verifyToken);
router.get("/trial-balance", accountController.getTrialBalance);
router.get("/", accountController.getAllAccounts);
router.post("/", accountController.createAccount);
router.get("/:id", accountController.getAccountById);
router.put("/:id", accountController.updateAccount);
router.patch("/:id/deactivate", accountController.deactivateAccount);

module.exports = router;
