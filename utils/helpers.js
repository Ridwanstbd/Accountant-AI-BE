const generateCode = (prefix, lastCode = null) => {
  let nextNumber = 1;

  if (lastCode) {
    const lastNumber = parseInt(lastCode.split("-").pop());
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
};

const generateJournalNumber = (type, lastJournalNo = null) => {
  let prefix = "J";
  switch (type) {
    case "GENERAL":
      prefix = "JU";
      break;
    case "SALES":
      prefix = "JP";
      break;
    case "EXPENSE":
      prefix = "JK";
      break;
    case "PURCHASE":
      prefix = "JB";
      break;
    default:
      prefix = "J";
  }
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  let nextNumber = 1;
  if (lastJournalNo) {
    const lastNumber = parseInt(lastJournalNo.split("-").pop());
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${year}${month}-${String(nextNumber).padStart(4, "0")}`;
};

const generateSaleNumber = (lastSaleNo = null) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  let nextNumber = 1;
  if (lastSaleNo) {
    const lastNumber = parseInt(lastSaleNo.split("-").pop());
    nextNumber = lastNumber + 1;
  }

  return `SALE-${year}${month}-${String(nextNumber).padStart(4, "0")}`;
};

const validateJournalBalance = (entries) => {
  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((entry) => {
    totalDebit += parseFloat(entry.debitAmount || 0);
    totalCredit += parseFloat(entry.creditAmount || 0);
  });

  return Math.abs(totalDebit - totalCredit) < 0.01;
};

module.exports = {
  generateCode,
  generateJournalNumber,
  generateSaleNumber,
  validateJournalBalance,
};
