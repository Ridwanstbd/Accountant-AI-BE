const UserService = require("../services/userService");
const {
  updateUserSchema,
  assignRoleSchema,
} = require("../validators/userValidator");

class UserController {
  static async getUsers(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await UserService.getUsers(page, limit);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      res.json({ user });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { error } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const user = await UserService.updateUser(id, req.body);

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async assignRole(req, res) {
    try {
      const { error } = assignRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { roleId } = req.body;
      const result = await UserService.assignRole(id, roleId);

      res.json({
        message: "Role assigned successfully",
        userRole: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async removeRole(req, res) {
    try {
      const { id, roleId } = req.params;
      const result = await UserService.removeRole(id, roleId);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.deactivateUser(id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async activateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.activateUser(id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { error } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const userId = req.user.id;
      const user = await UserService.updateUser(userId, req.body);

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = UserController;
