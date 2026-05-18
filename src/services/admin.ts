import { api } from '@/lib/api'

export interface AdminUser {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  premiumEnabled: boolean
}

export interface ImpersonateResponse {
  accessToken: string
  userId: string
  email: string
}

export const adminService = {
  listUsers: () => api.get<AdminUser[]>('/api/admin/users').then(r => r.data),
  updateRole: (userId: string, role: 'USER' | 'ADMIN') =>
    api.put<AdminUser>(`/api/admin/users/${userId}/role`, { role }).then(r => r.data),
  togglePremium: (userId: string, enabled: boolean) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/premium-enabled`, { enabled }).then(r => r.data),
  impersonate: (userId: string) =>
    api.post<ImpersonateResponse>(`/api/admin/impersonate/${userId}`).then(r => r.data),
}
