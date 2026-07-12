import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import { getToken, isAuthenticated } from '../utils/auth'
import Spinner from '../components/Spinner'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingForm, setLoadingForm] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    contrasenaActual: '',
    nuevaContrasena: '',
    repetirContrasena: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    try {
      const token = getToken()
      const response = await api.get('/usuarios/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const { nombre, email, telefono } = response.data
      setForm(prev => ({ ...prev, nombre, email, telefono: telefono || '' }))
    } catch (err) {
      setError('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.nuevaContrasena && form.nuevaContrasena !== form.repetirContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.nuevaContrasena && !form.contrasenaActual) {
      setError('Debés ingresar tu contraseña actual')
      return
    }

    setLoadingForm(true)
    try {
      const token = getToken()
      const datos = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono
      }

      if (form.nuevaContrasena) {
        datos.contrasenaActual = form.contrasenaActual
        datos.nuevaContrasena = form.nuevaContrasena
      }

      await api.put('/usuarios/me', datos, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSuccess('Perfil actualizado correctamente')
      setForm(prev => ({
        ...prev,
        contrasenaActual: '',
        nuevaContrasena: '',
        repetirContrasena: ''
      }))

      // actualizar nombre en localStorage
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      localStorage.setItem('usuario', JSON.stringify({ ...usuario, nombre: form.nombre, email: form.email }))

    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil')
    } finally {
      setLoadingForm(false)
    }
  }

  if (loading) return <Spinner mensaje="Cargando perfil..." />

  return (
    <div className="profile">
      <div className="profile-box">
        <h1>Mi perfil</h1>
        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="profile-divider">
            <p>Cambiar contraseña (opcional)</p>
          </div>

          <div className="form-group">
            <label>Contraseña actual</label>
            <input
              type="password"
              name="contrasenaActual"
              value={form.contrasenaActual}
              onChange={handleChange}
              placeholder="Solo si querés cambiarla"
            />
          </div>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              name="nuevaContrasena"
              value={form.nuevaContrasena}
              onChange={handleChange}
              placeholder="Nueva contraseña"
            />
          </div>
          <div className="form-group">
            <label>Repetir nueva contraseña</label>
            <input
              type="password"
              name="repetirContrasena"
              value={form.repetirContrasena}
              onChange={handleChange}
              placeholder="Repetir contraseña"
            />
          </div>

          <button type="submit" disabled={loadingForm}>
            {loadingForm ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile