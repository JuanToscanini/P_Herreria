import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <p className="notfound-mensaje">Página no encontrada</p>
      <p className="notfound-descripcion">La página que buscás no existe o fue movida.</p>
      <Link to="/" className="notfound-btn">Volver al inicio</Link>
    </div>
  )
}

export default NotFound