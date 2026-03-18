import axiosClient from "../axiosClient";
import type { ApiResponse, PaginatedResult } from "../../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5082";

/** Chuyển filename avatar thành URL tĩnh — ví dụ: "abc123.jpg" → "http://localhost:5082/avatars/abc123.jpg" */
export const getAvatarUrl = (avatar: string | null | undefined): string | null => {
  if (!avatar) return null;
  return `${BASE_URL}/avatars/${avatar}`;
};

export interface UserListDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
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
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  roles: RoleSummaryDto[];
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserCreateDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface UserUpdateDto {
  username?: string;
  email?: string;
  fullName?: string;
  isActive?: boolean;
}

export interface UserChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

const userService = {
  getUsers: async (page = 1, pageSize = 20) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResult<UserListDto>>>(
      `/users?page=${page}&pageSize=${pageSize}`
    );
    return res.data.data;
  },

  getUserById: async (id: string): Promise<UserDto> => {
    const res = await axiosClient.get<ApiResponse<UserDto>>(`/users/${id}`);
    return res.data.data;
  },

  getUserWithRoles: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<UserWithRolesDto>>(`/users/${id}/roles`);
    return res.data.data;
  },

  createUser: async (dto: UserCreateDto): Promise<UserDto> => {
    const res = await axiosClient.post<ApiResponse<UserDto>>("/users", dto);
    return res.data.data;
  },

  updateMe: async (dto: UserUpdateDto): Promise<UserDto> => {
    const res = await axiosClient.put<ApiResponse<UserDto>>("/users/me", dto);
    return res.data.data;
  },

  updateUser: async (id: string, dto: UserUpdateDto): Promise<UserDto> => {
    const res = await axiosClient.put<ApiResponse<UserDto>>(`/users/${id}`, dto);
    return res.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await axiosClient.delete(`/users/${id}`);
  },

  assignRoles: async (userId: string, roleIds: string[]) => {
    await axiosClient.post(`/users/${userId}/roles`, { roleIds });
  },

  toggleLock: async (userId: string): Promise<UserDto> => {
    const res = await axiosClient.patch<ApiResponse<UserDto>>(`/users/${userId}/toggle-lock`);
    return res.data.data;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axiosClient.post<ApiResponse<{ avatar: string }>>(
      "/users/me/avatar",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data.avatar;
  },

  changeMyPassword: async (dto: UserChangePasswordDto): Promise<void> => {
    await axiosClient.post("/users/me/change-password", dto);
  },

  changePassword: async (userId: string, dto: UserChangePasswordDto): Promise<void> => {
    await axiosClient.post(`/users/${userId}/change-password`, dto);
  },
};

export default userService;
