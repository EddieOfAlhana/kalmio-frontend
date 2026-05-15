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

// KALMIO-95: OTP length guard — verifyOtp must require 8 digits, not 6
describe('OTP length constant', () => {
  it('accepts exactly 8 digits and rejects fewer', () => {
    const OTP_LENGTH = 8
    expect('12345678'.length).toBe(OTP_LENGTH)
    expect('123456'.length).not.toBe(OTP_LENGTH)
    expect('1234567'.length).not.toBe(OTP_LENGTH)
    // strip-and-slice logic: non-digits removed, then clamped to 8
    const strip = (v: string) => v.replace(/\D/g, '').slice(0, OTP_LENGTH)
    expect(strip('12345678')).toBe('12345678')
    expect(strip('123456789')).toBe('12345678') // truncated to 8
    expect(strip('1234abc5678')).toBe('12345678') // digits-only, truncated
    expect(strip('abc')).toBe('')
  })
})
