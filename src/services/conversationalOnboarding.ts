/**
 * conversationalOnboarding.ts — KALMIO-186
 *
 * Service for the conversational onboarding flow (E11.7).
 *
 * Backend endpoints:
 *   POST /api/onboarding/conversational/turn   (@RequiresPremium)
 *   POST /api/onboarding/conversational/finalize (@RequiresPremium)
 *
 * STUB NOTE: The backend endpoints do not yet exist (tracked for backend-dev).
 * This service simulates multi-turn conversation with canned responses so the
 * UI can be developed and tested end-to-end. When the real endpoints land,
 * delete the STUB section and uncomment the live calls.
 */

import { api } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────

export interface ChatTurn {
  role: 'assistant' | 'user'
  content: string
}

/** Partial profile extracted incrementally by the LLM. */
export interface PreferencesDraft {
  householdSize: number | null
  kcalTarget: number | null
  dietaryRestrictions: string[]
  shoppingCadenceDays: number | null
  preferredShoppingDay: string | null
  forbiddenIngredientIds: string[]
}

export interface TurnResponse {
  sessionId: string
  assistantMessage: string
  /** True when the LLM has collected all required fields. */
  ready: boolean
  extracted: PreferencesDraft | null
}

export interface FinalizeRequest {
  sessionId: string
  confirmedDraft: PreferencesDraft
}

export interface FinalizeResponse {
  success: boolean
}

// ── STUB ──────────────────────────────────────────────────────────────────
// Remove this block when the real backend endpoints are available.

const STUB_SESSION_ID = 'stub-session-186'

const STUB_TURNS: string[] = [
  'Szia! Mesélj egy kicsit az étkezési szokásaidról. Hány főre szoktál főzni általában?',
  'Rendben. Mennyi kalóriát szeretnél naponta körülbelül bevinni? (Ha nem tudod pontosan, adj meg egy hozzávetőleges értéket.)',
  'Köszönöm. Van-e valamilyen étrendi megszorításod? Például vegetáriánus, gluténmentes, laktózmentes étrendet követsz?',
  'Értem. Milyen sűrűn szoktál bevásárolni? Hetente egyszer, kétszer, vagy ennél ritkábban?',
  'Melyik nap szokott a legkényelmesebb lenni a bevásárláshoz?',
  'Van-e valamilyen hozzávaló, amit feltétlenül ki szeretnél zárni az étrendedből? Ha nincs, csak mondd, hogy nincs.',
  'Köszönöm, megvan minden, ami kell. Összesítem a preferenciáidat — egy pillanat.',
]

function buildStubDraft(turnIndex: number): PreferencesDraft | null {
  if (turnIndex < STUB_TURNS.length - 1) return null
  return {
    householdSize: 2,
    kcalTarget: 2000,
    dietaryRestrictions: [],
    shoppingCadenceDays: 7,
    preferredShoppingDay: 'SATURDAY',
    forbiddenIngredientIds: [],
  }
}

// Factory pattern — each instance has its own turn counter so navigating
// away and back starts a fresh conversation rather than resuming mid-flow.
const createStub = () => {
  let turn = 0
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendTurn: async (_messages: ChatTurn[]): Promise<TurnResponse> => {
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
      const idx = turn
      const isLast = idx >= STUB_TURNS.length - 1
      const response: TurnResponse = {
        sessionId: STUB_SESSION_ID,
        assistantMessage: STUB_TURNS[Math.min(idx, STUB_TURNS.length - 1)],
        ready: isLast,
        extracted: buildStubDraft(idx),
      }
      turn = Math.min(turn + 1, STUB_TURNS.length - 1)
      return response
    },
    finalize: async (): Promise<void> => {
      turn = 0
    },
  }
}

let stubInstance = createStub()

// ── Service ───────────────────────────────────────────────────────────────

const USE_STUB = true // flip to false once backend ships

export const conversationalOnboardingService = {
  /**
   * Send the current conversation history and get the next assistant turn.
   * The backend is responsible for extracting a `PreferencesDraft` from the
   * full context; we pass the rolling `messages` array each call.
   */
  sendTurn: (messages: ChatTurn[]): Promise<TurnResponse> => {
    if (USE_STUB) return stubInstance.sendTurn(messages)
    return api
      .post<TurnResponse>('/api/onboarding/conversational/turn', { messages })
      .then((r) => r.data)
  },

  /**
   * Finalize the session: write `confirmedDraft` to `UserMealPreferences` +
   * `UserShoppingCadence` and trigger first-plan generation.
   */
  finalizeOnboarding: (req: FinalizeRequest): Promise<FinalizeResponse> => {
    if (USE_STUB) {
      void stubInstance.finalize()
      return Promise.resolve({ success: true })
    }
    return api
      .post<FinalizeResponse>('/api/onboarding/conversational/finalize', req)
      .then((r) => r.data)
  },

  /**
   * Reset the stub to a fresh instance. Call on component mount so navigating
   * away and back always restarts from turn 0.
   */
  _resetStub: () => {
    stubInstance = createStub()
  },
}
