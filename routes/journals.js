const express = require("express");
const journalController = require("../controllers/journalController");

const router = express.Router();

router.post("/sales", journalController.createSalesJournal);
router.get("/", journalController.getAllJournals);
router.post("/", journalController.createJournal);
router.get("/:id", journalController.getJournalById);
router.patch("/:id/post", journalController.postJournal);
router.delete("/:id", journalController.deleteJournal);

module.exports = router;
