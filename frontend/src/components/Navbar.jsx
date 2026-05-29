import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Navbar.css'

function Navbar({ titulo, links, cantidadCarrito }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setMenuAbierto(false)
    navigate('/')
  }

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
        {usuario?.rol === 'admin' && (
          <li><Link to="/usuarios">Usuarios</Link></li>
        )}
      </ul>

      <div className="navbar-actions">
        <div className="navbar-cart">
          🛒 {cantidadCarrito}
        </div>
        <div className="navbar-user">
          <button
            className="navbar-user-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            👤
          </button>
          {menuAbierto && (
            <div className="navbar-dropdown">
              {usuario ? (
                <>
                  <p className="dropdown-nombre">{usuario.nombre}</p>
                  <Link to="/perfil" onClick={() => setMenuAbierto(false)}>Mi perfil</Link>
                  <button onClick={handleLogout}>Cerrar sesión</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuAbierto(false)}>Iniciar sesión</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar