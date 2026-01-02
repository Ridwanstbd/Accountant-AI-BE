const { prisma } = require("../models");

const authorize = (requiredPermission, isBusinessLevel = true) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Diambil dari middleware verifyToken sebelumnya
      const businessId = req.headers["x-business-id"];

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: No user data" });
      }

      // 1. BYPASS: Jika Super Admin, izinkan semua akses
      if (user.isSuperAdmin) {
        return next();
      }

      let hasPermission = false;

      if (isBusinessLevel) {
        // --- LOGIKA PENGECEKAN LEVEL BISNIS ---
        if (!businessId) {
          return res.status(400).json({
            success: false,
            message: "Header x-business-id diperlukan untuk akses ini",
          });
        }

        // Ambil data businessUser beserta permission-nya
        const bizMember = await prisma.businessUser.findUnique({
          where: {
            businessId_userId: { businessId, userId: user.id },
          },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        });

        if (!bizMember || !bizMember.isActive) {
          return res.status(403).json({
            success: false,
            message: "Anda bukan anggota aktif di bisnis ini",
          });
        }

        // Cek apakah permission ada di dalam role bisnis tersebut
        hasPermission = bizMember.role.permissions.some(
          (rp) => rp.permission.name === requiredPermission
        );
      } else {
        // --- LOGIKA PENGECEKAN LEVEL GLOBAL (Aplikasi) ---
        const userGlobalRoles = await prisma.userRole.findMany({
          where: { userId: user.id },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        });

        // Gabungkan semua permission dari semua role global yang dimiliki user
        hasPermission = userGlobalRoles.some((ur) =>
          ur.role.permissions.some(
            (rp) => rp.permission.name === requiredPermission
          )
        );
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Anda tidak memiliki izin [${requiredPermission}]`,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error pada sistem otorisasi",
      });
    }
  };
};

module.exports = authorize;
