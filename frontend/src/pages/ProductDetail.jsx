import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axiosConfig'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const response = await api.get(`/productos/${id}`)
        setProducto(response.data)
      } catch (err) {
        setError('Error al cargar el producto')
      } finally {
        setLoading(false)
      }
    }
    fetchProducto()
  }, [id])

  if (loading) return <p className="loading">Cargando...</p>
  if (error) return <p className="error">{error}</p>
  if (!producto) return <p>Producto no encontrado</p>

  return (
    <div className="product-detail">
      <h1>{producto.nombre}</h1>
      {producto.imagenes && producto.imagenes.length > 0 && (
        <img src={producto.imagenes[0]} alt={producto.nombre} className="detail-image" />
      )}
      <p className="detail-description">{producto.descripcion}</p>
      <p className="detail-price">Precio: ${producto.precio}</p>
      <p className="detail-stock">Stock: {producto.stock}</p>
      <p className="detail-category">Categoría: {producto.categoria}</p>
    </div>
  )
}

export default ProductDetail
