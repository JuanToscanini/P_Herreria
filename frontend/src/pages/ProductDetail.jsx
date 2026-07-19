import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api/axiosConfig'
import { getRol } from '../utils/auth'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
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

  const handleAgregar = () => {
    addToCart({
      _id: producto._id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      imagenes: producto.imagenes
    })
    toast.success('Producto agregado al carrito')
  }

  if (loading) return <Spinner mensaje="Cargando producto..." />
  if (error) return <Spinner mensaje="Error al cargar el producto" />
  if (!producto) return <p>Producto no encontrado</p>

  return (
    <div className="product-detail">
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Volver
      </button>
      {getRol() === 'admin' && (
        <button
          className="detail-edit"
          onClick={() => navigate(`/productos/editar/${id}`)}
        >
          Editar producto
        </button>
      )}
      <h1>{producto.nombre}</h1>
      {producto.imagenes && producto.imagenes.length > 0 && (
        <img src={producto.imagenes[0]} alt={producto.nombre} className="detail-image" />
      )}
      <p className="detail-description">{producto.descripcion}</p>
      <p className="detail-price">Precio: ${producto.precio}</p>
      <p className="detail-stock">Stock: {producto.stock}</p>
      <p className="detail-category">Categoría: {producto.categoria}</p>
      <button className="btn-add-cart" onClick={handleAgregar}>Agregar al carrito</button>
    </div>
  )
}

export default ProductDetail
