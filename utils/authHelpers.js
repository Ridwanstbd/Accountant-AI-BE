const { prisma } = require("../models");
class AuthHelpers {
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user with updated information
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          businessUsers: {
            where: { isActive: true },
            include: {
              business: true,
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isSuperAdmin: user.isSuperAdmin,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  static generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  static hasPermission(user, permission) {
    if (user.isSuperAdmin) return true;
    return user.globalPermissions?.includes(permission) || false;
  }

  static hasBusinessPermission(user, businessId, permission) {
    if (user.isSuperAdmin) return true;
    return (
      user.businessPermissions?.[businessId]?.includes(permission) || false
    );
  }

  static isBusinessMember(user, businessId) {
    if (user.isSuperAdmin) return true;
    return (
      user.businessUsers?.some(
        (bu) => bu.businessId === businessId && bu.isActive
      ) || false
    );
  }
}

module.exports = AuthHelpers;
