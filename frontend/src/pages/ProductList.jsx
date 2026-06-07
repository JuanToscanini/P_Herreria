import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import api from '../api/axiosConfig'
import './ProductList.css'
import Spinner from '../components/Spinner'


function ProductList() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [inactivos, setInactivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const esAdmin = usuario?.rol === 'admin'

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem('token')
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
      const token = localStorage.getItem('token')
      await api.put(`/productos/${id}`, { activo: true }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchProductos()
    } catch (err) {
      setError('Error al reactivar el producto')
    }
  }

  if (loading) return <Spinner mensaje="Cargando productos..." />
  if (error) return <Spinner mensaje="Error al cargar los productos" />

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h1>Productos</h1>
        {esAdmin && (
          <button onClick={() => navigate('/productos/nuevo')}>
            Nuevo producto
          </button>
        )}
      </div>

      <div className="products-grid">
        {productos.map(producto => (
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
                  <th>Reactivar</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map(producto => (
                  <tr key={producto._id}>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria}</td>
                    <td>${producto.precio}</td>
                    <td>
                      <button
                        className="btn-reactivar"
                        onClick={() => reactivarProducto(producto._id)}
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
    </div>
  )
}

export default ProductList
