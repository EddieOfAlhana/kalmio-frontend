import { api } from '@/lib/api'

export interface AdminUser {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export const adminService = {
  listUsers: () => api.get<AdminUser[]>('/api/admin/users').then(r => r.data),
  updateRole: (userId: string, role: 'USER' | 'ADMIN') =>
    api.put<AdminUser>(`/api/admin/users/${userId}/role`, { role }).then(r => r.data),
}
