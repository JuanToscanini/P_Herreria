import { Link } from 'react-router-dom'
import './ProductCard.css'

function ProductCard({ id, nombre, categoria, precio, imagenes }) {
  return (
    <div className="product-card">
      {imagenes && imagenes.length > 0 ? (
        <img src={imagenes[0]} alt={nombre} className="product-image" />
      ) : (
        <div className="product-image-placeholder">Sin imagen</div>
      )}
      <div className="product-info">
        <h3>{nombre}</h3>
        <p className="product-category">{categoria}</p>
        <p className="product-price">${precio}</p>
        <Link to={`/productos/${id}`} className="product-link">Ver detalle</Link>
      </div>
    </div>
  )
}

export default ProductCard
