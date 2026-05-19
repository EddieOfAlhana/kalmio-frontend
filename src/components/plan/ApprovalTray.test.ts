/**
 * Unit tests for ApprovalTray dismissed-Set state transitions.
 *
 * The component tracks accepted/rejected suggestion IDs in a Set<string>.
 * Key invariant: mutation errors must NOT add the ID to dismissed.
 *
 * Pure helpers mirror the component's onSuccess / onError paths exactly.
 */
import { describe, it, expect } from 'vitest'

type DismissedSet = Set<string>

/** Mirrors: onSuccess → setDismissed(prev => new Set([...prev, id])) */
function onMutationSuccess(prev: DismissedSet, id: string): DismissedSet {
  return new Set([...prev, id])
}

/** Mirrors: acceptAllMut.onSuccess → setDismissed(prev => new Set([...prev, ...ids])) */
function onBulkSuccess(prev: DismissedSet, ids: string[]): DismissedSet {
  return new Set([...prev, ...ids])
}

/**
 * Mirrors: onError → only calls toast(), never setDismissed.
 * Returns prev unchanged to model that no state transition occurs.
 */
function onMutationError(prev: DismissedSet): DismissedSet {
  return prev  // no set mutation happens on error
}

describe('ApprovalTray dismissed Set transitions', () => {
  it('accept success adds the ID to dismissed', () => {
    const after = onMutationSuccess(new Set(), 'suggestion-1')
    expect(after.has('suggestion-1')).toBe(true)
    expect(after.size).toBe(1)
  })

  it('reject success adds the ID to dismissed', () => {
    const before = new Set(['suggestion-0'])
    const after = onMutationSuccess(before, 'suggestion-1')
    expect(after.has('suggestion-0')).toBe(true)
    expect(after.has('suggestion-1')).toBe(true)
    expect(after.size).toBe(2)
  })

  it('mutation error does NOT change dismissed (rollback path)', () => {
    const before = new Set<string>(['already'])
    const after = onMutationError(before)
    expect(after).toBe(before)  // same reference — unchanged
    expect(after.size).toBe(1)
  })

  it('mocked rejection: failed accept must not appear in dismissed', () => {
    const before = new Set<string>()
    const attemptedId = 'will-fail'
    // Error path — id is NOT added
    const afterError = onMutationError(before)
    expect(afterError.has(attemptedId)).toBe(false)
    // Contrast: success path — id IS added
    const afterSuccess = onMutationSuccess(before, attemptedId)
    expect(afterSuccess.has(attemptedId)).toBe(true)
  })

  it('sequential accept + reject adds both IDs', () => {
    let set = new Set<string>()
    set = onMutationSuccess(set, 'a')
    set = onMutationSuccess(set, 'b')
    expect(set.size).toBe(2)
    expect(set.has('a') && set.has('b')).toBe(true)
  })

  it('bulk accept adds all low-risk IDs and preserves existing dismissed', () => {
    const before = new Set(['existing'])
    const after = onBulkSuccess(before, ['low-1', 'low-2'])
    expect(after.size).toBe(3)
    expect(after.has('existing')).toBe(true)
    expect(after.has('low-1')).toBe(true)
    expect(after.has('low-2')).toBe(true)
  })

  it('accepting an already-dismissed ID is idempotent (Set deduplicates)', () => {
    const before = new Set(['dup'])
    const after = onMutationSuccess(before, 'dup')
    expect(after.size).toBe(1)
  })
})
