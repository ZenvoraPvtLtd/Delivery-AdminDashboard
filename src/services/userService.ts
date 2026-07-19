import { api } from './api';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  department: string;
}

export interface RolePermissionResponse {
  module: string;
  view: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
  approve: boolean;
}

export interface RoleResponse {
  id: string;
  roleName: string;
  usersCount: number;
  permissions: RolePermissionResponse[];
}

class UserService {
  async getUsers(): Promise<UserResponse[]> {
    const res = await api.get('/api/v1/admin/users');
    return res.data;
  }

  async getRoles(): Promise<RoleResponse[]> {
    const res = await api.get('/api/v1/admin/roles');
    return res.data;
  }
}

export const userService = new UserService();
