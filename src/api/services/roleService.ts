import axiosClient from "../axiosClient";
import type { ApiResponse, PaginatedResult } from "../../types/api";

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface PermissionDto {
  id: string;
  code: string;
  description: string | null;
}

export interface RoleWithPermissionsDto extends RoleDto {
  permissions: PermissionDto[];
}

const roleService = {
  getRoles: async (page = 1, pageSize = 50) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResult<RoleDto>>>(
      `/roles?page=${page}&pageSize=${pageSize}`
    );
    return res.data.data;
  },

  getRoleWithPermissions: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<RoleWithPermissionsDto>>(
      `/roles/${id}/permissions`
    );
    return res.data.data;
  },

  createRole: async (data: { name: string; description?: string }) => {
    const res = await axiosClient.post<ApiResponse<RoleDto>>("/roles", data);
    return res.data.data;
  },

  updateRole: async (id: string, data: { name: string; description?: string }) => {
    const res = await axiosClient.put<ApiResponse<RoleDto>>(`/roles/${id}`, data);
    return res.data.data;
  },

  deleteRole: async (id: string) => {
    await axiosClient.delete(`/roles/${id}`);
  },

  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    await axiosClient.post(`/roles/${roleId}/permissions`, { permissionIds });
  },

  getPermissions: async (page = 1, pageSize = 100) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResult<PermissionDto>>>(
      `/permissions?page=${page}&pageSize=${pageSize}`
    );
    return res.data.data;
  },

  createPermission: async (data: { code: string; description?: string }) => {
    const res = await axiosClient.post<ApiResponse<PermissionDto>>("/permissions", data);
    return res.data.data;
  },

  updatePermission: async (id: string, data: { code: string; description?: string }) => {
    const res = await axiosClient.put<ApiResponse<PermissionDto>>(`/permissions/${id}`, data);
    return res.data.data;
  },

  deletePermission: async (id: string) => {
    await axiosClient.delete(`/permissions/${id}`);
  },
};

export default roleService;
