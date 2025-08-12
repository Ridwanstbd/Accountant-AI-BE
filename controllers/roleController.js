const RoleService = require("../services/roleService");
const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
  assignMultiplePermissionsSchema,
} = require("../validators/roleValidator");

class RoleController {
  static async getRoles(req, res) {
    try {
      const roles = await RoleService.getRoles();
      res.json({ roles });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(id);
      res.json({ role });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  static async createRole(req, res) {
    try {
      const { error } = createRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const role = await RoleService.createRole(req.body);

      res.status(201).json({
        message: "Role created successfully",
        role,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateRole(req, res) {
    try {
      const { error } = updateRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const role = await RoleService.updateRole(id, req.body);

      res.json({
        message: "Role updated successfully",
        role,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const result = await RoleService.deleteRole(id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async assignPermission(req, res) {
    try {
      const { error } = assignPermissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { permissionId } = req.body;
      const result = await RoleService.assignPermission(id, permissionId);

      res.json({
        message: "Permission assigned successfully",
        rolePermission: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async assignMultiplePermissions(req, res) {
    try {
      const { error } = assignMultiplePermissionsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { permissionIds } = req.body;
      const result = await RoleService.assignMultiplePermissions(
        id,
        permissionIds
      );

      res.json({
        message: "Permissions assigned successfully",
        result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async removePermission(req, res) {
    try {
      const { id, permissionId } = req.params;
      const result = await RoleService.removePermission(id, permissionId);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = RoleController;
