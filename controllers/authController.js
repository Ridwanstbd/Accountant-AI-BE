const AuthService = require("../services/authService");

class AuthController {
  static async register(req, res) {
    try {
      // Validasi manual dihapus karena sudah ditangani middleware di routes
      const user = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: "Business owner account registered successfully.",
        user,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async inviteStaff(req, res) {
    try {
      const businessId = req.headers["x-business-id"];
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Header x-business-id wajib diisi",
        });
      }

      const user = await AuthService.inviteStaff(businessId, req.body);

      res.status(201).json({
        success: true,
        message: "Staff berhasil didaftarkan ke bisnis Anda",
        data: user,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async joinBusiness(req, res) {
    try {
      const { businessCode, inviteCode } = req.body;
      const userId = req.user.id;

      const businessUser = await AuthService.joinBusiness(
        userId,
        businessCode,
        inviteCode
      );

      res.json({
        message: "Successfully joined business",
        businessUser,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          isSuperAdmin: req.user.isSuperAdmin,
          isActive: req.user.isActive,
          profile: req.user.profile,
          globalRoles:
            req.user.userRoles?.map((ur) => ({
              id: ur.role.id,
              name: ur.role.name,
              displayName: ur.role.displayName,
            })) || [],
          businesses:
            req.user.businessUsers?.map((bu) => ({
              id: bu.business.id,
              name: bu.business.name,
              code: bu.business.code,
              role: {
                id: bu.role.id,
                name: bu.role.name,
                displayName: bu.role.displayName,
              },
              isActive: bu.isActive,
              joinedAt: bu.joinedAt,
            })) || [],
          globalPermissions: req.user.globalPermissions || [],
          businessPermissions: req.user.businessPermissions || {},
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        message: "Token refreshed successfully",
        ...result,
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  static async logout(req, res) {
    try {
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AuthController;
