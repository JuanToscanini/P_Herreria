import { Link } from 'react-router-dom'
import './ProductCard.css'

function ProductCard({ producto }) {
  return (
    <div className="product-card">
      {producto.imagenes && producto.imagenes.length > 0 ? (
        <img src={producto.imagenes[0]} alt={producto.nombre} className="product-image" />
      ) : (
        <div className="product-image-placeholder">Sin imagen</div>
      )}
      <div className="product-info">
        <h3>{producto.nombre}</h3>
        <p className="product-category">{producto.categoria}</p>
        <p className="product-price">${producto.precio}</p>
        <Link to={`/productos/${producto._id}`} className="product-link">Ver detalle</Link>
      </div>
    </div>
  )
}

export default ProductCard
