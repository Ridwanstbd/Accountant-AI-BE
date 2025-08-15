const { prisma } = require("../models");

const businessAuth = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userBusinesses = await prisma.businessUser.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      include: { business: true },
    });

    if (userBusinesses.length === 0) {
      return res.status(403).json({
        success: false,
        message: "User has no business access",
      });
    }
    const requestedBusinessId =
      req.headers["business-id"] || req.query.businessId;

    let selectedBusiness;
    if (requestedBusinessId) {
      selectedBusiness = userBusinesses.find(
        (ub) => ub.businessId === requestedBusinessId
      );
      if (!selectedBusiness) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this business",
        });
      }
    } else {
      selectedBusiness = userBusinesses[0];
    }

    req.businessId = selectedBusiness.businessId;
    req.business = selectedBusiness.business;
    req.businessRole = selectedBusiness.role;
    req.userBusinesses = userBusinesses;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Business authorization failed",
      error: error.message,
    });
  }
};

module.exports = businessAuth;
