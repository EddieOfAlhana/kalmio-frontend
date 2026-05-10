import { api } from '@/lib/api'
import type {
  CreateFeedbackRequest,
  FeedbackDetail,
  FeedbackSummary,
} from '@/types'

export const feedbackService = {
  create: (body: CreateFeedbackRequest) =>
    api.post<FeedbackDetail>('/api/feedback', body).then(r => r.data),

  listMine: () =>
    api.get<FeedbackSummary[]>('/api/feedback/mine').then(r => r.data),

  getMine: (id: string) =>
    api.get<FeedbackDetail>(`/api/feedback/mine/${id}`).then(r => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/api/feedback/unread-count').then(r => r.data.count),

  markRead: (id: string) =>
    api.post(`/api/feedback/${id}/read`),

  addMessage: (id: string, body: string) =>
    api.post(`/api/feedback/${id}/messages`, { body }).then(r => r.data),

  // Admin
  listAll: () =>
    api.get<FeedbackSummary[]>('/api/admin/feedback').then(r => r.data),

  getDetail: (id: string) =>
    api.get<FeedbackDetail>(`/api/admin/feedback/${id}`).then(r => r.data),

  getAdminUnreadCount: () =>
    api.get<{ count: number }>('/api/admin/feedback/unread-count').then(r => r.data.count),

  updateStatus: (id: string, status: string, replyNote?: string) =>
    api.patch<FeedbackDetail>(`/api/admin/feedback/${id}/status`, { status, replyNote }).then(r => r.data),

  addAdminMessage: (id: string, body: string) =>
    api.post(`/api/admin/feedback/${id}/messages`, { body }).then(r => r.data),

  deleteFeedback: (id: string) =>
    api.delete(`/api/admin/feedback/${id}`),
}
