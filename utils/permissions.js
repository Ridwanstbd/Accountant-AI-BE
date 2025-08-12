const PERMISSIONS = {
  // User Management
  USER_VIEW: "user_view",
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",
  USER_MANAGE_ROLES: "user_manage_roles",

  // Business Management
  BUSINESS_VIEW: "business_view",
  BUSINESS_CREATE: "business_create",
  BUSINESS_UPDATE: "business_update",
  BUSINESS_DELETE: "business_delete",
  BUSINESS_MANAGE_USERS: "business_manage_users",
  BUSINESS_VIEW_FINANCES: "business_view_finances",
  BUSINESS_MANAGE_FINANCES: "business_manage_finances",

  // Role Management
  ROLE_VIEW: "role_view",
  ROLE_CREATE: "role_create",
  ROLE_UPDATE: "role_update",
  ROLE_DELETE: "role_delete",
  ROLE_ASSIGN_PERMISSIONS: "role_assign_permissions",

  // Permission Management
  PERMISSION_VIEW: "permission_view",
  PERMISSION_CREATE: "permission_create",
  PERMISSION_UPDATE: "permission_update",
  PERMISSION_DELETE: "permission_delete",

  // Accounting
  ACCOUNT_VIEW: "account_view",
  ACCOUNT_CREATE: "account_create",
  ACCOUNT_UPDATE: "account_update",
  ACCOUNT_DELETE: "account_delete",

  // Journal
  JOURNAL_VIEW: "journal_view",
  JOURNAL_CREATE: "journal_create",
  JOURNAL_UPDATE: "journal_update",
  JOURNAL_DELETE: "journal_delete",
  JOURNAL_POST: "journal_post",

  // Sales
  SALE_VIEW: "sale_view",
  SALE_CREATE: "sale_create",
  SALE_UPDATE: "sale_update",
  SALE_DELETE: "sale_delete",

  // Customers
  CUSTOMER_VIEW: "customer_view",
  CUSTOMER_CREATE: "customer_create",
  CUSTOMER_UPDATE: "customer_update",
  CUSTOMER_DELETE: "customer_delete",

  // AI Recommendations
  AI_RECOMMENDATION_VIEW: "ai_recommendation_view",
  AI_RECOMMENDATION_CREATE: "ai_recommendation_create",
  AI_RECOMMENDATION_DELETE: "ai_recommendation_delete",
};

const MODULES = {
  USER: "user",
  BUSINESS: "business",
  ROLE: "role",
  PERMISSION: "permission",
  ACCOUNT: "account",
  JOURNAL: "journal",
  SALE: "sale",
  CUSTOMER: "customer",
  AI: "ai",
};

const DEFAULT_PERMISSIONS = [
  // User Management
  {
    name: PERMISSIONS.USER_VIEW,
    displayName: "View Users",
    module: MODULES.USER,
  },
  {
    name: PERMISSIONS.USER_CREATE,
    displayName: "Create Users",
    module: MODULES.USER,
  },
  {
    name: PERMISSIONS.USER_UPDATE,
    displayName: "Update Users",
    module: MODULES.USER,
  },
  {
    name: PERMISSIONS.USER_DELETE,
    displayName: "Delete Users",
    module: MODULES.USER,
  },
  {
    name: PERMISSIONS.USER_MANAGE_ROLES,
    displayName: "Manage User Roles",
    module: MODULES.USER,
  },

  // Business Management
  {
    name: PERMISSIONS.BUSINESS_VIEW,
    displayName: "View Business",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_CREATE,
    displayName: "Create Business",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_UPDATE,
    displayName: "Update Business",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_DELETE,
    displayName: "Delete Business",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_MANAGE_USERS,
    displayName: "Manage Business Users",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_VIEW_FINANCES,
    displayName: "View Business Finances",
    module: MODULES.BUSINESS,
  },
  {
    name: PERMISSIONS.BUSINESS_MANAGE_FINANCES,
    displayName: "Manage Business Finances",
    module: MODULES.BUSINESS,
  },

  // Accounting
  {
    name: PERMISSIONS.ACCOUNT_VIEW,
    displayName: "View Accounts",
    module: MODULES.ACCOUNT,
  },
  {
    name: PERMISSIONS.ACCOUNT_CREATE,
    displayName: "Create Accounts",
    module: MODULES.ACCOUNT,
  },
  {
    name: PERMISSIONS.ACCOUNT_UPDATE,
    displayName: "Update Accounts",
    module: MODULES.ACCOUNT,
  },
  {
    name: PERMISSIONS.ACCOUNT_DELETE,
    displayName: "Delete Accounts",
    module: MODULES.ACCOUNT,
  },

  // Journal
  {
    name: PERMISSIONS.JOURNAL_VIEW,
    displayName: "View Journals",
    module: MODULES.JOURNAL,
  },
  {
    name: PERMISSIONS.JOURNAL_CREATE,
    displayName: "Create Journals",
    module: MODULES.JOURNAL,
  },
  {
    name: PERMISSIONS.JOURNAL_UPDATE,
    displayName: "Update Journals",
    module: MODULES.JOURNAL,
  },
  {
    name: PERMISSIONS.JOURNAL_DELETE,
    displayName: "Delete Journals",
    module: MODULES.JOURNAL,
  },
  {
    name: PERMISSIONS.JOURNAL_POST,
    displayName: "Post Journals",
    module: MODULES.JOURNAL,
  },

  // Sales
  {
    name: PERMISSIONS.SALE_VIEW,
    displayName: "View Sales",
    module: MODULES.SALE,
  },
  {
    name: PERMISSIONS.SALE_CREATE,
    displayName: "Create Sales",
    module: MODULES.SALE,
  },
  {
    name: PERMISSIONS.SALE_UPDATE,
    displayName: "Update Sales",
    module: MODULES.SALE,
  },
  {
    name: PERMISSIONS.SALE_DELETE,
    displayName: "Delete Sales",
    module: MODULES.SALE,
  },

  // Customers
  {
    name: PERMISSIONS.CUSTOMER_VIEW,
    displayName: "View Customers",
    module: MODULES.CUSTOMER,
  },
  {
    name: PERMISSIONS.CUSTOMER_CREATE,
    displayName: "Create Customers",
    module: MODULES.CUSTOMER,
  },
  {
    name: PERMISSIONS.CUSTOMER_UPDATE,
    displayName: "Update Customers",
    module: MODULES.CUSTOMER,
  },
  {
    name: PERMISSIONS.CUSTOMER_DELETE,
    displayName: "Delete Customers",
    module: MODULES.CUSTOMER,
  },

  // AI Recommendations
  {
    name: PERMISSIONS.AI_RECOMMENDATION_VIEW,
    displayName: "View AI Recommendations",
    module: MODULES.AI,
  },
  {
    name: PERMISSIONS.AI_RECOMMENDATION_CREATE,
    displayName: "Create AI Recommendations",
    module: MODULES.AI,
  },
  {
    name: PERMISSIONS.AI_RECOMMENDATION_DELETE,
    displayName: "Delete AI Recommendations",
    module: MODULES.AI,
  },
];

module.exports = {
  PERMISSIONS,
  MODULES,
  DEFAULT_PERMISSIONS,
};
