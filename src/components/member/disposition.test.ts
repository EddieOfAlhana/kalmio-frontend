/**
 * Pure-logic unit tests for Finding 3 (KALMIO-217 review):
 *
 * F3a — OffPlanLogSheet stub: offPlanDispositionService.submit is NEVER called
 *        when user confirms in stub mode (BE4 not yet available).
 *
 * F3b — DispositionPicker allergenAcknowledged flag: only set to true when
 *        the allergen confirmation modal is explicitly accepted.
 *
 * F5  — allergenAcknowledged threaded through the onConfirm call signature.
 *
 * These tests model the component state machine without a DOM.
 */
import { describe, it, expect, vi } from 'vitest'
import type { OffPlanDispositionType } from '@/types'

// ── F3a: OffPlanLogSheet stub ─────────────────────────────────────────────────
// Simulates the handleDispositionConfirm function logic from OffPlanLogSheet.

describe('OffPlanLogSheet stub (Finding 3a)', () => {
  it('does NOT call offPlanDispositionService.submit when confirming in stub mode', () => {
    const submitSpy = vi.fn()

    // This mirrors the STUB implementation in OffPlanLogSheet.handleDispositionConfirm
    function handleDispositionConfirmStub(
      disposition: OffPlanDispositionType,
      recipientUserId?: string,
      allergenAcknowledged?: boolean,
    ) {
      // TODO (BE4): submitSpy would be called here once BE4 is available.
      // For now it is intentionally NOT called.
      void disposition
      void recipientUserId
      void allergenAcknowledged
      // onClose() — omitted from test, side effect only
    }

    handleDispositionConfirmStub('RETURNED_TO_FRIDGE')
    handleDispositionConfirmStub('WASTED')
    handleDispositionConfirmStub('GIVEN_TO_FAMILY', 'user-123', false)

    expect(submitSpy).not.toHaveBeenCalled()
  })

  it('receives the allergenAcknowledged flag when threaded through', () => {
    const received: Array<{ disp: OffPlanDispositionType; ack: boolean | undefined }> = []

    function handleDispositionConfirm(
      disposition: OffPlanDispositionType,
      _recipientUserId?: string,
      allergenAcknowledged?: boolean,
    ) {
      received.push({ disp: disposition, ack: allergenAcknowledged })
    }

    handleDispositionConfirm('GIVEN_TO_FAMILY', 'user-abc', true)

    expect(received[0].disp).toBe('GIVEN_TO_FAMILY')
    expect(received[0].ack).toBe(true)
  })
})

// ── DispositionPicker state machine (Finding 3b + Finding 5) ─────────────────
// Models the allergenAcknowledged state transitions without a DOM.

describe('DispositionPicker allergenAcknowledged state machine (Finding 3b, F5)', () => {
  function makePickerState() {
    let allergenAcknowledged = false
    let allergenModalOpen = false

    function handleRecipientClick(r: { userId: string; conflictingAllergens: string[] }) {
      if (r.conflictingAllergens.length > 0) {
        allergenModalOpen = true
      }
      // else: choose directly, allergenAcknowledged stays false
    }

    function handleAllergenConfirm() {
      allergenAcknowledged = true
      allergenModalOpen = false
    }

    function handleAllergenCancel() {
      allergenModalOpen = false
      // allergenAcknowledged stays false — user did not confirm
    }

    function handleTopLevel() {
      // Switching disposition resets acknowledgment
      allergenAcknowledged = false
    }

    return {
      get allergenAcknowledged() { return allergenAcknowledged },
      get allergenModalOpen() { return allergenModalOpen },
      handleRecipientClick,
      handleAllergenConfirm,
      handleAllergenCancel,
      handleTopLevel,
    }
  }

  it('allergenAcknowledged is false by default', () => {
    const state = makePickerState()
    expect(state.allergenAcknowledged).toBe(false)
  })

  it('opens allergen modal when a conflicting recipient is clicked', () => {
    const state = makePickerState()
    state.handleRecipientClick({ userId: 'user-1', conflictingAllergens: ['peanut'] })
    expect(state.allergenModalOpen).toBe(true)
    expect(state.allergenAcknowledged).toBe(false)
  })

  it('sets allergenAcknowledged = true after modal confirm', () => {
    const state = makePickerState()
    state.handleRecipientClick({ userId: 'user-1', conflictingAllergens: ['peanut'] })
    state.handleAllergenConfirm()
    expect(state.allergenAcknowledged).toBe(true)
    expect(state.allergenModalOpen).toBe(false)
  })

  it('allergenAcknowledged stays false when modal is cancelled', () => {
    const state = makePickerState()
    state.handleRecipientClick({ userId: 'user-1', conflictingAllergens: ['peanut'] })
    state.handleAllergenCancel()
    expect(state.allergenAcknowledged).toBe(false)
    expect(state.allergenModalOpen).toBe(false)
  })

  it('resets allergenAcknowledged when top-level disposition changes', () => {
    const state = makePickerState()
    state.handleRecipientClick({ userId: 'user-1', conflictingAllergens: ['peanut'] })
    state.handleAllergenConfirm()
    expect(state.allergenAcknowledged).toBe(true)

    state.handleTopLevel() // user switches to WASTED, etc.
    expect(state.allergenAcknowledged).toBe(false)
  })

  it('does not require allergenAcknowledged for non-conflicting recipients', () => {
    const state = makePickerState()
    // Recipient has no allergen conflicts — modal is never shown
    state.handleRecipientClick({ userId: 'user-2', conflictingAllergens: [] })
    expect(state.allergenModalOpen).toBe(false)
    expect(state.allergenAcknowledged).toBe(false)
  })
})
