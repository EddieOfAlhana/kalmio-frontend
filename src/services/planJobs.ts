import { api } from '@/lib/api'
import type {
  GenerateMealPlanRequest,
  MealPlan,
  PlanJobProgress,
  PlanJobStatusResponse,
} from '@/types'

/** How often we poll while waiting for a job to finish. */
const POLL_INTERVAL_MS = 1_500

/** Hard ceiling so a stuck job doesn't poll forever. ~3 minutes covers worst-case queue + solve. */
const MAX_POLL_ATTEMPTS = 120

export const planJobsService = {
  /** Enqueue a meal-plan generation job. Returns the new jobId within ~50 ms. */
  enqueue: (body: GenerateMealPlanRequest) =>
    api.post<{ jobId: string }>('/api/plan-jobs', body).then(r => r.data),

  /** One-shot status fetch. The caller is responsible for polling. */
  getStatus: (jobId: string) =>
    api.get<PlanJobStatusResponse>(`/api/plan-jobs/${jobId}`).then(r => r.data),
}

export interface AwaitJobOptions {
  /** Called on every poll tick with the current PENDING/RUNNING progress. */
  onProgress?: (progress: PlanJobProgress) => void
  /** AbortSignal — if aborted the promise rejects with a DOMException("AbortError"). */
  signal?: AbortSignal
}

/**
 * Polls a plan-job until it reaches a terminal state and returns the parsed {@link MealPlan}.
 *
 * <p>Throws when the job ends in FAILED (with the server's error message) or when the
 * {@link AbortSignal} fires.
 */
export async function awaitJobResult(
  jobId: string,
  options: AwaitJobOptions = {}
): Promise<MealPlan> {
  const { onProgress, signal } = options

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const status = await planJobsService.getStatus(jobId)

    if (status.status === 'DONE') {
      if (!status.result) {
        throw new Error('Plan job completed without a result payload')
      }
      return JSON.parse(status.result) as MealPlan
    }
    if (status.status === 'FAILED') {
      throw new Error(status.errorMessage ?? 'Plan generation failed')
    }

    onProgress?.({
      status: status.status,
      queuePosition: status.queuePosition,
      estimatedWaitSeconds: status.estimatedWaitSeconds,
    })

    await sleep(POLL_INTERVAL_MS, signal)
  }

  throw new Error('Plan job did not complete in the expected time window')
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
