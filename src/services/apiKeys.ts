import { api } from '@/lib/api'

export interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}

export interface ApiKeyCreated {
  id: number
  name: string
  keyPrefix: string
  plaintext: string
}

export const apiKeysService = {
  list: () => api.get<ApiKey[]>('/api/user/api-keys').then(r => r.data),

  create: (name: string) =>
    api.post<ApiKeyCreated>('/api/user/api-keys', { name }).then(r => r.data),

  revoke: (id: number) => api.delete(`/api/user/api-keys/${id}`),

  revokeAll: () => api.delete('/api/user/api-keys'),
}
