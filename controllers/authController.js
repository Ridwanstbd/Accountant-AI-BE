const AuthService = require("../services/authService");
const {
  registerSchema,
  loginSchema,
  joinBusinessSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidator");

class AuthController {
  static async register(req, res) {
    try {
      const { error } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const user = await AuthService.register(req.body);

      res.status(201).json({
        message: "User registered successfully.",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { error } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.json({
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async joinBusiness(req, res) {
    try {
      const { error } = joinBusinessSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

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
      const { error } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

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
      const { error } = forgotPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { error } = resetPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

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
      // In a real application, you might want to blacklist the token
      // or store it in a database to prevent reuse
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AuthController;
