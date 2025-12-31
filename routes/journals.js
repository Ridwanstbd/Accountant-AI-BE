const express = require("express");
const journalController = require("../controllers/journalController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createJournalSchema,
  createSalesJournalSchema,
  journalQuerySchema,
} = require("../validators/journalValidator");

const router = express.Router();

router.use(verifyToken);

router.get(
  "/",
  validate(journalQuerySchema, "query"),
  journalController.getAllJournals
);
router.post(
  "/",
  validate(createJournalSchema, "body"),
  journalController.createJournal
);
router.post(
  "/sales",
  validate(createSalesJournalSchema, "body"),
  journalController.createSalesJournal
);

router.get("/:id", journalController.getJournalById);
router.patch("/:id/post", journalController.postJournal);
router.delete("/:id", journalController.deleteJournal);

module.exports = router;
