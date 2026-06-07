import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import './NewProduct.css'

function NewProduct() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loadingForm, setLoadingForm] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: 'parrilla',
    imagenes: ''
  })

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    if (!usuario || usuario.rol !== 'admin') {
      navigate('/productos')
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || !form.precio || !form.stock) {
      setError('Nombre, precio y stock son obligatorios')
      return
    }

    const imagenes = form.imagenes
      ? form.imagenes.split(',').map(url => url.trim()).filter(Boolean)
      : []

    setLoadingForm(true)
    try {
      const token = localStorage.getItem('token')
      await api.post('/productos', {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        stock: Number(form.stock),
        categoria: form.categoria,
        imagenes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate('/productos')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el producto')
    } finally {
      setLoadingForm(false)
    }
  }

  return (
    <div className="new-product">
      <div className="new-product-box">
        <h1>Nuevo producto</h1>
        {error && <p className="new-product-error">{error}</p>}
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
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Precio</label>
            <input
              type="number"
              name="precio"
              value={form.precio}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}>
              <option value="parrilla">Parrilla</option>
              <option value="asador">Asador</option>
              <option value="rejilla">Rejilla</option>
              <option value="accesorio">Accesorio</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Imágenes <span className="optional">(URLs separadas por coma)</span></label>
            <input
              type="text"
              name="imagenes"
              value={form.imagenes}
              onChange={handleChange}
              placeholder="https://..., https://..."
            />
          </div>
          <div className="new-product-actions">
            <button type="button" onClick={() => navigate('/productos')} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" disabled={loadingForm}>
              {loadingForm ? 'Creando...' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProduct
