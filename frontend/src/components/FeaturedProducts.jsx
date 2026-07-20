import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosConfig'
import './FeaturedProducts.css'

function FeaturedProducts() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchDestacados = async () => {
      try {
        const response = await api.get('/productos')
        const conStock = response.data.filter(p => p.stock > 0)
        const seleccion = (conStock.length > 0 ? conStock : response.data).slice(0, 4)
        setProductos(seleccion)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDestacados()
  }, [])

  const formatPesos = (value) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value || 0))

  if (loading) {
    return (
      <div className="featured-products">
        <h2 className="featured-title">Productos Destacados</h2>
        <p className="featured-status">Cargando productos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="featured-products">
        <h2 className="featured-title">Productos Destacados</h2>
        <p className="featured-status">No se pudieron cargar los productos en este momento.</p>
      </div>
    )
  }

  if (productos.length === 0) {
    return null
  }

  return (
    <div className="featured-products">
      <h2 className="featured-title">Productos Destacados</h2>

      <div className="featured-grid">
        {productos.map(producto => (
          <Link key={producto._id} to={`/productos/${producto._id}`} className="featured-card">
            {producto.imagenes && producto.imagenes.length > 0 ? (
              <img src={producto.imagenes[0]} alt={producto.nombre} className="featured-card-image" />
            ) : (
              <div className="featured-card-image-placeholder">Sin imagen</div>
            )}
            <div className="featured-card-info">
              <h3>{producto.nombre}</h3>
              <p className="featured-card-categoria">{producto.categoria}</p>
              <p className="featured-card-precio">{formatPesos(producto.precio)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="featured-cta">
        <Link to="/productos" className="home-btn">Ver todos los productos</Link>
      </div>
    </div>
  )
}

export default FeaturedProducts
