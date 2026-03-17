import axiosClient from "../axiosClient";
import type { ApiResponse, PaginatedResult } from "../../types/api";

export interface UserListDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

export interface RoleSummaryDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface UserWithRolesDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  roles: RoleSummaryDto[];
}

const userService = {
  getUsers: async (page = 1, pageSize = 20) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResult<UserListDto>>>(
      `/users?page=${page}&pageSize=${pageSize}`
    );
    return res.data.data;
  },

  getUserWithRoles: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<UserWithRolesDto>>(`/users/${id}/roles`);
    return res.data.data;
  },

  assignRoles: async (userId: string, roleIds: string[]) => {
    await axiosClient.post(`/users/${userId}/roles`, { roleIds });
  },

  toggleLock: async (userId: string): Promise<UserListDto> => {
    const res = await axiosClient.patch<ApiResponse<UserListDto>>(`/users/${userId}/toggle-lock`);
    return res.data.data;
  },
};

export default userService;
