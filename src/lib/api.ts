import axios from 'axios'
import { supabase } from './supabase'
import { useAuthStore } from '@/store/auth'

const BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
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
