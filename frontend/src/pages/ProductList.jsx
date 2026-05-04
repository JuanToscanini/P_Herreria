import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import api from '../api/axiosConfig'
import './ProductList.css'

function ProductList() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await api.get('/productos')
        setProductos(response.data)
      } catch (err) {
        setError('Error al cargar los productos')
      } finally {
        setLoading(false)
      }
    }
    fetchProductos()
  }, [])

  if (loading) return <p className="loading">Cargando productos...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="product-list">
      <h1>Productos</h1>
      <div className="products-grid">
        {productos.map(producto => (
          <ProductCard key={producto._id} producto={producto} />
        ))}
      </div>
    </div>
  )
}

export default ProductList
