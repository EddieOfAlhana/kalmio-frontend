import { api } from '@/lib/api'
import type { StartGroomingResponse, GroomingSession, GroomingDecision } from '@/types'

export const groomingService = {
  start: (): Promise<StartGroomingResponse> =>
    api.post<StartGroomingResponse>('/api/grooming/start').then(r => r.data),

  complete: (sessionId: string, decisions: GroomingDecision[]): Promise<GroomingSession> =>
    api.post<GroomingSession>(`/api/grooming/${sessionId}/complete`, { decisions }).then(r => r.data),

  getById: (sessionId: string): Promise<GroomingSession> =>
    api.get<GroomingSession>(`/api/grooming/${sessionId}`).then(r => r.data),
}
