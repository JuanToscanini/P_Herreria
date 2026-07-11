import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api/axiosConfig'
import { getRol } from '../utils/auth'
import Spinner from '../components/Spinner'
import './EditUser.css'

function EditUser() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    rol: 'cliente',
    activo: true
  })

  useEffect(() => {
    if (getRol() !== 'admin') {
      navigate('/usuarios')
      return
    }
    fetchUsuario()
  }, [])

  const fetchUsuario = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get(`/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const { nombre, email, rol, activo } = response.data
      setForm({ nombre, email, contrasena: '', rol, activo })
    } catch (err) {
      toast.error('Error al cargar el usuario')
      navigate('/usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.email) {
      toast.error('Nombre y email son obligatorios')
      return
    }

    const body = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo }
    if (form.contrasena.trim()) {
      body.contrasena = form.contrasena
    }

    setLoadingForm(true)
    try {
      const token = localStorage.getItem('token')
      await api.put(`/usuarios/${id}`, body, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Usuario actualizado correctamente')
      navigate('/usuarios')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el usuario')
    } finally {
      setLoadingForm(false)
    }
  }

  if (loading) return <Spinner mensaje="Cargando usuario..." />

  return (
    <div className="edit-user">
      <div className="edit-user-box">
        <h1>Editar usuario</h1>
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
            <label>Contraseña <span className="optional">(opcional)</span></label>
            <input
              type="password"
              name="contrasena"
              value={form.contrasena}
              onChange={handleChange}
              placeholder="Dejar vacío para no cambiar"
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange}>
              <option value="cliente">Cliente</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group form-group-checkbox">
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
              />
              Activo
            </label>
          </div>
          <div className="edit-user-actions">
            <button type="button" onClick={() => navigate('/usuarios')} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" disabled={loadingForm}>
              {loadingForm ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUser