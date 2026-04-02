/**
 * Role helper utilities for role-based access control
 * Supports three roles: admin, teacher, student
 */

export type UserRole = 'admin' | 'teacher' | 'student';

/**
 * Normalize role from unknown type to string
 * Handles both string roles and object shapes {name: string}
 */
export const normalizeRoleName = (role: unknown): UserRole | null => {
    if (typeof role === 'string') {
        const normalized = role.toLowerCase() as UserRole;
        if (['admin', 'teacher', 'student'].includes(normalized)) {
            return normalized;
        }
    }
    if (
        role &&
        typeof role === 'object' &&
        'name' in role &&
        typeof (role as { name?: unknown }).name === 'string'
    ) {
        const normalized = ((role as { name: string }).name).toLowerCase() as UserRole;
        if (['admin', 'teacher', 'student'].includes(normalized)) {
            return normalized;
        }
    }
    return null;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (roles: unknown[], role: UserRole): boolean => {
    return !Array.isArray(roles)
        ? false
        : roles.some((r) => normalizeRoleName(r) === role);
};

/**
 * Check if user has any of the given roles
 */
export const hasAnyRole = (roles: unknown[], allowedRoles: UserRole[]): boolean => {
    if (!Array.isArray(roles)) return false;
    return roles.some((r) => {
        const normalized = normalizeRoleName(r);
        return normalized && allowedRoles.includes(normalized);
    });
};

/**
 * Get normalized roles array
 */
export const getNormalizedRoles = (roles: unknown[]): UserRole[] => {
    if (!Array.isArray(roles)) return [];
    return roles
        .map((r) => normalizeRoleName(r))
        .filter((r): r is UserRole => r !== null);
};

/**
 * Role feature visibility config
 */
export const ROLE_FEATURES = {
    admin: {
        canViewDashboard: true,
        canViewExams: true,
        canCreateExam: true,
        canManageSubjects: true,
        canManageGroups: true,
        canManageUsers: true,
        canManageRoles: true,
        canAssignExams: true,
        canViewAllResults: true,
    },
    teacher: {
        canViewDashboard: true,
        canViewExams: true,
        canCreateExam: true,
        canManageSubjects: false,
        canManageGroups: true,
        canManageUsers: false,
        canManageRoles: false,
        canAssignExams: true,
        canViewAllResults: true,
    },
    student: {
        canViewDashboard: true,
        canViewExams: true,
        canCreateExam: false,
        canManageSubjects: false,
        canManageGroups: false,
        canManageUsers: false,
        canManageRoles: false,
        canAssignExams: false,
        canViewAllResults: false,
    },
};

/**
 * Check if user can perform a feature based on their roles
 */
export const canPerformFeature = (
    roles: unknown[],
    feature: keyof typeof ROLE_FEATURES.admin
): boolean => {
    const normalizedRoles = getNormalizedRoles(roles);
    if (normalizedRoles.length === 0) return false;

    // If user has admin role, they can perform any feature
    if (normalizedRoles.includes('admin')) {
        return ROLE_FEATURES.admin[feature];
    }

    // Check if any of the user's roles allows this feature
    return normalizedRoles.some((role) => ROLE_FEATURES[role][feature]);
};
