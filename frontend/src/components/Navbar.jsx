import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ titulo, links, cantidadCarrito }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">{titulo}</Link>
      </div>
      <ul className="navbar-links">
        {links.map((link, index) => (
          <li key={index}>
            <Link to={link.ruta}>{link.nombre}</Link>
          </li>
        ))}
      </ul>
      <div className="navbar-cart">
        🛒 {cantidadCarrito}
      </div>
    </nav>
  )
}

export default Navbar