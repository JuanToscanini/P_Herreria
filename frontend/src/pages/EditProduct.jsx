import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api/axiosConfig'
import { getRol } from '../utils/auth'
import Spinner from '../components/Spinner'
import './EditProduct.css'

function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: ''
  })

  useEffect(() => {
    if (getRol() !== 'admin') {
      navigate('/productos')
      return
    }
    fetchProducto()
  }, [])

  const fetchProducto = async () => {
    try {
      const response = await api.get(`/productos/${id}`)
      const { nombre, descripcion, precio, stock, categoria } = response.data
      setForm({ nombre, descripcion, precio, stock, categoria })
    } catch (err) {
      toast.error('Error al cargar el producto')
      navigate('/productos')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.precio || !form.stock) {
      toast.error('Nombre, precio y stock son obligatorios')
      return
    }

    setLoadingForm(true)
    try {
      const token = localStorage.getItem('token')
      await api.put(`/productos/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Producto actualizado correctamente')
      navigate('/productos')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el producto')
    } finally {
      setLoadingForm(false)
    }
  }

  if (loading) return <Spinner mensaje="Cargando producto..." />

  return (
    <div className="edit-product">
      <div className="edit-product-box">
        <h1>Editar producto</h1>
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
            />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
            />
          </div>
          <div className="edit-product-actions">
            <button type="button" onClick={() => navigate('/productos')} className="btn-cancelar">
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

export default EditProduct