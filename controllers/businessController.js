const BusinessService = require("../services/businessService");
const {
  createBusinessSchema,
  updateBusinessSchema,
  assignBusinessRoleSchema,
} = require("../validators/businessValidator");

class BusinessController {
  static async createBusiness(req, res) {
    try {
      const { error } = createBusinessSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const business = await BusinessService.createBusiness(req.body);

      res.status(201).json({
        message: "Business created successfully",
        business,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
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
      const { error } = updateBusinessSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

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
      const { error } = assignBusinessRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

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
      const userId = req.user.id;

      // Get businesses where user is a member
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

      res.json({ businesses });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = BusinessController;
