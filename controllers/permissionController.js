const PermissionService = require("../services/permissionService");
const {
  createPermissionSchema,
  updatePermissionSchema,
  createMultiplePermissionsSchema,
} = require("../validators/permissionValidator");

class PermissionController {
  static async getPermissions(req, res) {
    try {
      const permissions = await PermissionService.getPermissions();
      res.json({ permissions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPermissionsByModule(req, res) {
    try {
      const grouped = await PermissionService.getPermissionsByModule();
      res.json({ modules: grouped });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPermissionById(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);
      res.json({ permission });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  static async createPermission(req, res) {
    try {
      const { error } = createPermissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const permission = await PermissionService.createPermission(req.body);

      res.status(201).json({
        message: "Permission created successfully",
        permission,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async createMultiplePermissions(req, res) {
    try {
      const { error } = createMultiplePermissionsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { permissions } = req.body;
      const result = await PermissionService.createMultiplePermissions(
        permissions
      );

      res.status(201).json({
        message: "Permissions created successfully",
        permissions: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updatePermission(req, res) {
    try {
      const { error } = updatePermissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const permission = await PermissionService.updatePermission(id, req.body);

      res.json({
        message: "Permission updated successfully",
        permission,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async deletePermission(req, res) {
    try {
      const { id } = req.params;
      const result = await PermissionService.deletePermission(id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = PermissionController;
