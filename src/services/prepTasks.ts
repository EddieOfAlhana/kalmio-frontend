import { api } from '@/lib/api'

export const prepTasksService = {
  patchScheduledTime: (taskId: string, scheduledTime: string | null): Promise<void> =>
    api.patch(`/api/prep-tasks/${taskId}/scheduled-time`, { scheduledTime }).then(() => undefined),
}
