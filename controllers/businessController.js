const BusinessService = require("../services/businessService");

class BusinessController {
  static async createBusiness(req, res) {
    try {
      const userId = req.user.id;
      const business = await BusinessService.createBusiness(userId, req.body);

      res.status(201).json({
        success: true,
        message: "Business created and linked to your account.",
        data: business,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBusinessById(req, res) {
    try {
      const { businessId } = req.params;
      const business = await BusinessService.getBusinessById(businessId);

      res.json({ business });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  static async updateBusiness(req, res) {
    try {
      const { businessId } = req.params;
      const business = await BusinessService.updateBusiness(
        businessId,
        req.body
      );

      res.json({
        message: "Business updated successfully",
        business,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getBusinessUsers(req, res) {
    try {
      const { businessId } = req.params;
      const { page, limit } = req.query;

      const result = await BusinessService.getBusinessUsers(
        businessId,
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async assignUserRole(req, res) {
    try {
      const { businessId } = req.params;
      const { userId, roleId } = req.body;

      const result = await BusinessService.assignUserRole(
        businessId,
        userId,
        roleId
      );

      res.json({
        message: "Role assigned successfully",
        businessUser: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async removeUser(req, res) {
    try {
      const { businessId, userId } = req.params;
      const result = await BusinessService.removeUserFromBusiness(
        businessId,
        userId
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getUserBusinesses(req, res) {
    try {
      const businesses =
        req.user.businessUsers
          ?.filter((bu) => bu.isActive)
          .map((bu) => ({
            id: bu.business.id,
            name: bu.business.name,
            code: bu.business.code,
            description: bu.business.description,
            role: {
              id: bu.role.id,
              name: bu.role.name,
              displayName: bu.role.displayName,
            },
            permissions: req.user.businessPermissions[bu.business.id] || [],
            joinedAt: bu.joinedAt,
          })) || [];

      res.json({
        success: true,
        message: "Business retrivied successfully!",
        data: businesses,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = BusinessController;
