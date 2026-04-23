import axios from 'axios'

// Vite dev-server proxies /api → localhost:8080; in prod point to the backend URL
const BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: BASE,
  // HTTP Basic auth – dev only
  auth: { username: 'kalmio', password: 'change-me' },
  headers: { 'Content-Type': 'application/json' },
})
