import { describe, it, expect } from 'vitest'
import { mapAuthError } from './authErrors'

describe('mapAuthError', () => {
  it('maps HTTP 429 to rateLimited', () => {
    expect(mapAuthError({ status: 429, message: 'too many requests' })).toBe('auth.errors.rateLimited')
  })

  it('maps HTTP 400 with example.com address that is invalid to invalidEmailFormat (KALMIO-79: no client-side test-domain blocking)', () => {
    expect(mapAuthError({ status: 400, message: 'Email address "teszt@example.com" is invalid' })).toBe('auth.errors.invalidEmailFormat')
  })

  it('maps HTTP 400 with "not allowed" message (no is-invalid phrase) to invalidEmail fallback (KALMIO-79)', () => {
    expect(mapAuthError({ status: 400, message: 'Email domain example.com is not allowed' })).toBe('auth.errors.invalidEmail')
  })

  it('maps HTTP 400 with "invalid email" phrase to invalidEmailFormat', () => {
    expect(mapAuthError({ status: 400, message: 'Invalid email address provided' })).toBe('auth.errors.invalidEmailFormat')
  })

  it('maps HTTP 400 with "is invalid" phrase (no test domain) to invalidEmailFormat', () => {
    expect(mapAuthError({ status: 400, message: 'Email address user@notadomain is invalid' })).toBe('auth.errors.invalidEmailFormat')
  })

  it('maps HTTP 400 with unrecognised message to invalidEmail fallback', () => {
    expect(mapAuthError({ status: 400, message: 'Something unexpected went wrong' })).toBe('auth.errors.invalidEmail')
  })

  it('maps HTTP 400 with signup-disabled message to signupsDisabled', () => {
    expect(mapAuthError({ status: 400, message: 'Signups not allowed for this instance' })).toBe('auth.errors.signupsDisabled')
  })

  it('maps HTTP 400 with "sign up" phrasing to signupsDisabled', () => {
    expect(mapAuthError({ status: 400, message: 'Email sign up is disabled' })).toBe('auth.errors.signupsDisabled')
  })

  it('maps fetch-level network error to network', () => {
    const err = new Error('Failed to fetch')
    expect(mapAuthError(err)).toBe('auth.errors.network')
  })

  it('maps error with no status to network', () => {
    expect(mapAuthError({ message: 'Something happened' })).toBe('auth.errors.network')
  })

  it('maps unknown non-400 status to generic', () => {
    expect(mapAuthError({ status: 500, message: 'Internal server error' })).toBe('auth.errors.generic')
  })

  it('maps null/undefined gracefully to network (no status)', () => {
    expect(mapAuthError(null)).toBe('auth.errors.network')
    expect(mapAuthError(undefined)).toBe('auth.errors.network')
  })
})
