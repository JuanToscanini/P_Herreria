import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProductCard from '../components/ProductCard'
import api from '../api/axiosConfig'
import { getRol, getToken } from '../utils/auth'
import './ProductList.css'
import Spinner from '../components/Spinner'


function ProductList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [inactivos, setInactivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [eliminandoId, setEliminandoId] = useState(null)
  const esAdmin = getRol() === 'admin'
  const categoriaFiltro = searchParams.get('categoria')

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      const token = getToken()
      const config = esAdmin ? { headers: { Authorization: `Bearer ${token}` } } : {}
      const response = await api.get('/productos', config)
      setProductos(response.data.filter(p => p.activo))
      if (esAdmin) setInactivos(response.data.filter(p => !p.activo))
    } catch (err) {
      setError('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const reactivarProducto = async (id) => {
    try {
      const token = getToken()
      await api.put(`/productos/${id}`, { activo: true }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchProductos()
    } catch (err) {
      setError('Error al reactivar el producto')
    }
  }

  const eliminarProductoPermanente = async (id, nombre) => {
    const confirmado = window.confirm(
      `⚠️ Esta acción es IRREVERSIBLE y borra "${nombre}" de la base de datos de forma permanente. ¿Confirmás?`
    )
    if (!confirmado) return

    setEliminandoId(id)
    try {
      const token = getToken()
      await api.delete(`/productos/${id}/permanente`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Producto eliminado definitivamente')
      fetchProductos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar definitivamente el producto')
    } finally {
      setEliminandoId(null)
    }
  }

  const productosFiltrados = productos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro
    return coincideNombre && coincideCategoria
  })

  if (loading) return <Spinner mensaje="Cargando productos..." />
  if (error) return <Spinner mensaje="Error al cargar los productos" />

  return (
    <div className="product-list">
      <div className="product-list-header">
        <input
          type="text"
          className="product-search-input"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {esAdmin && (
          <button onClick={() => navigate('/productos/nuevo')}>
            Nuevo producto
          </button>
        )}
      </div>

      <div className="products-grid">
        {productosFiltrados.map(producto => (
          <ProductCard
            key={producto._id}
            id={producto._id}
            nombre={producto.nombre}
            categoria={producto.categoria}
            precio={producto.precio}
            imagenes={producto.imagenes}
          />
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <p className="products-empty">No se encontraron productos</p>
      )}

      {esAdmin && inactivos.length > 0 && (
        <div className="productos-inactivos">
          <h2>Productos inactivos</h2>
          <div className="productos-inactivos-table-container">
            <table className="productos-inactivos-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map(producto => (
                  <tr key={producto._id}>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria}</td>
                    <td>${producto.precio}</td>
                    <td className="productos-inactivos-acciones">
                      <button
                        className="btn-reactivar"
                        onClick={() => reactivarProducto(producto._id)}
                      >
                        Reactivar
                      </button>
                      <button
                        className="btn-eliminar-permanente"
                        onClick={() => eliminarProductoPermanente(producto._id, producto.nombre)}
                        disabled={eliminandoId === producto._id}
                      >
                        {eliminandoId === producto._id ? 'Eliminando...' : '⚠️ Eliminar definitivamente'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
