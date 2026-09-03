export type UserRole = "ADMIN" | "SALES" | "RESEARCH" | "VIEWER";

interface PermissionConfig {
  canViewAll: boolean;
  canEditAll: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canImport: boolean;
  canExport: boolean;
  canAccessSettings: boolean;
  canAssignLeads: boolean;
  canCreateLeads: boolean;
  canLogActivity: boolean;
  canGenerateAI: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, PermissionConfig> = {
  ADMIN: {
    canViewAll: true,
    canEditAll: true,
    canDelete: true,
    canManageUsers: true,
    canImport: true,
    canExport: true,
    canAccessSettings: true,
    canAssignLeads: true,
    canCreateLeads: true,
    canLogActivity: true,
    canGenerateAI: true,
  },
  SALES: {
    canViewAll: true,
    canEditAll: true,
    canDelete: false,
    canManageUsers: false,
    canImport: true,
    canExport: true,
    canAccessSettings: false,
    canAssignLeads: false,
    canCreateLeads: true,
    canLogActivity: true,
    canGenerateAI: true,
  },
  RESEARCH: {
    canViewAll: true,
    canEditAll: false,
    canDelete: false,
    canManageUsers: false,
    canImport: true,
    canExport: true,
    canAccessSettings: false,
    canAssignLeads: false,
    canCreateLeads: true,
    canLogActivity: false,
    canGenerateAI: true,
  },
  VIEWER: {
    canViewAll: true,
    canEditAll: false,
    canDelete: false,
    canManageUsers: false,
    canImport: false,
    canExport: true,
    canAccessSettings: false,
    canAssignLeads: false,
    canCreateLeads: false,
    canLogActivity: false,
    canGenerateAI: false,
  },
};

export function getPermissions(role: string): PermissionConfig {
  return ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.VIEWER;
}

export function canView(role: string): boolean {
  return getPermissions(role).canViewAll;
}

export function canEdit(role: string): boolean {
  return getPermissions(role).canEditAll;
}

export function canDelete(role: string): boolean {
  return getPermissions(role).canDelete;
}

export function canAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: string): boolean {
  return getPermissions(role).canManageUsers;
}

export function canImport(role: string): boolean {
  return getPermissions(role).canImport;
}

export function canCreateLeads(role: string): boolean {
  return getPermissions(role).canCreateLeads;
}

export function canLogActivity(role: string): boolean {
  return getPermissions(role).canLogActivity;
}

export function canGenerateAI(role: string): boolean {
  return getPermissions(role).canGenerateAI;
}
