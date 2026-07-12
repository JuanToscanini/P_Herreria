import { jwtDecode } from 'jwt-decode'

export function getToken() {
  return localStorage.getItem('token')
}

export function getUserFromToken() {
  const token = getToken()
  if (!token) return null

  try {
    return jwtDecode(token)
  } catch (error) {
    return null
  }
}

export function isAuthenticated() {
  const payload = getUserFromToken()
  if (!payload?.exp) return false
  return Date.now() < payload.exp * 1000
}

export function getRol() {
  if (!isAuthenticated()) return null
  const payload = getUserFromToken()
  return payload?.rol ?? null
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}
