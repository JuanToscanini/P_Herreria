import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import Spinner from '../components/Spinner'
import './Users.css'

function Users() {
  const navigate = useNavigate()
  const [activos, setActivos] = useState([])
  const [inactivos, setInactivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    rol: 'cliente'
  })
  const [errorForm, setErrorForm] = useState(null)
  const [loadingForm, setLoadingForm] = useState(false)

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    if (!usuario || usuario.rol !== 'admin') {
      navigate('/productos')
      return
    }
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get('/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivos(response.data.filter(u => u.activo))
      setInactivos(response.data.filter(u => !u.activo))
    } catch (err) {
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const reactivarUsuario = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await api.put(`/usuarios/${id}`, { activo: true }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsuarios()
    } catch (err) {
      setError('Error al reactivar el usuario')
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorForm(null)

    if (!form.nombre || !form.email || !form.contrasena) {
      setErrorForm('Nombre, email y contraseña son obligatorios')
      return
    }

    setLoadingForm(true)
    try {
      const token = localStorage.getItem('token')
      await api.post('/usuarios/registro', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setForm({ nombre: '', email: '', contrasena: '', rol: 'cliente' })
      fetchUsuarios()
    } catch (err) {
      setErrorForm(err.response?.data?.error || 'Error al crear el usuario')
    } finally {
      setLoadingForm(false)
    }
  }

  if (loading) return <Spinner mensaje="Cargando usuarios..." />
  if (error) return <Spinner mensaje={error} />

  return (
    <div className="users">
      <h1>Usuarios</h1>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Editar</th>
            </tr>
          </thead>
          <tbody>
            {activos.map(usuario => (
              <tr key={usuario._id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>{usuario.rol}</td>
                <td>Activo</td>
                <td>
                  <button onClick={() => navigate(`/usuarios/editar/${usuario._id}`)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inactivos.length > 0 && (
        <div className="users-inactive">
          <h2>Usuarios inactivos</h2>
          <div className="users-table-container">
            <table className="users-table users-table-inactive">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Reactivar</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map(usuario => (
                  <tr key={usuario._id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.rol}</td>
                    <td>
                      <button
                        className="btn-reactivar"
                        onClick={() => reactivarUsuario(usuario._id)}
                      >
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="users-form">
        <h2>Nuevo usuario</h2>
        {errorForm && <p className="form-error">{errorForm}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="contrasena"
              value={form.contrasena}
              onChange={handleChange}
              placeholder="Contraseña"
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange}>
              <option value="cliente">Cliente</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loadingForm}>
            {loadingForm ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Users
