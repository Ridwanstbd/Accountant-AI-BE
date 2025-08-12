const jwt = require("jsonwebtoken");
const { prisma } = require("../models");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user with roles and permissions
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
      return res
        .status(401)
        .json({ message: "Invalid token or user inactive." });
    }

    // Add user info and permissions to request
    req.user = {
      ...user,
      password: undefined, // Remove password from request object
      globalPermissions: getUserGlobalPermissions(user),
      businessPermissions: getUserBusinessPermissions(user),
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

// Middleware to check if user is superadmin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res
      .status(403)
      .json({ message: "Access denied. Super admin required." });
  }
  next();
};

// Middleware to check specific global permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user?.isSuperAdmin) {
      return next(); // Super admin bypasses all permission checks
    }

    if (!req.user?.globalPermissions?.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`,
      });
    }
    next();
  };
};

// Middleware to check business-specific permission
const requireBusinessPermission = (permission) => {
  return (req, res, next) => {
    if (req.user?.isSuperAdmin) {
      return next(); // Super admin bypasses all permission checks
    }

    const businessId =
      req.params.businessId || req.body.businessId || req.query.businessId;

    if (!businessId) {
      return res.status(400).json({ message: "Business ID is required." });
    }

    const businessPermissions = req.user?.businessPermissions?.[businessId];
    if (!businessPermissions?.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Required business permission: ${permission}`,
      });
    }
    next();
  };
};

// Middleware to check if user is member of business
const requireBusinessMembership = (req, res, next) => {
  if (req.user?.isSuperAdmin) {
    return next(); // Super admin bypasses all checks
  }

  const businessId =
    req.params.businessId || req.body.businessId || req.query.businessId;

  if (!businessId) {
    return res.status(400).json({ message: "Business ID is required." });
  }

  const isMember = req.user?.businessUsers?.some(
    (bu) => bu.businessId === businessId && bu.isActive
  );

  if (!isMember) {
    return res.status(403).json({
      message: "Access denied. You are not a member of this business.",
    });
  }
  next();
};

// Middleware to check any of multiple permissions
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (req.user?.isSuperAdmin) {
      return next(); // Super admin bypasses all permission checks
    }

    const hasPermission = permissions.some((permission) =>
      req.user?.globalPermissions?.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required permissions: ${permissions.join(
          " or "
        )}`,
      });
    }
    next();
  };
};

// Helper function to get user global permissions
function getUserGlobalPermissions(user) {
  const permissions = new Set();

  user.userRoles?.forEach((userRole) => {
    userRole.role.permissions?.forEach((rolePermission) => {
      permissions.add(rolePermission.permission.name);
    });
  });

  return Array.from(permissions);
}

// Helper function to get user business permissions
function getUserBusinessPermissions(user) {
  const businessPermissions = {};

  user.businessUsers?.forEach((businessUser) => {
    if (businessUser.isActive) {
      const permissions = new Set();
      businessUser.role.permissions?.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
      businessPermissions[businessUser.businessId] = Array.from(permissions);
    }
  });

  return businessPermissions;
}

module.exports = {
  verifyToken,
  requireSuperAdmin,
  requirePermission,
  requireBusinessPermission,
  requireBusinessMembership,
  requireAnyPermission,
};
