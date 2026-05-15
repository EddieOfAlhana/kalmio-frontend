import axios from 'axios'
import { supabase } from './supabase'
import { useAuthStore, waitForAuthInit } from '@/store/auth'

const BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  // Impersonation token takes priority over all other auth paths.
  // Impersonation is set synchronously so no init wait is needed.
  const impersonationToken = useAuthStore.getState().impersonationToken
  if (impersonationToken) {
    config.headers.Authorization = `Bearer ${impersonationToken}`
    return config
  }

  // Block until the auth store has finished its initial hydration from
  // Supabase. Without this gate, requests that fire in the first ~200 ms
  // (before the INITIAL_SESSION event resolves) would call getSession()
  // while Supabase's internal cache is still empty, get null back, and
  // send the request without a Bearer token — causing 500s on the backend.
  await waitForAuthInit()

  // Try Supabase session first (magic link / OAuth flows)
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
    // Fall back to Zustand store for passkey-issued JWTs
    ?? useAuthStore.getState().session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
