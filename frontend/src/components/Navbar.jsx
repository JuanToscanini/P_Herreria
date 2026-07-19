import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { getRol, getToken } from '../utils/auth'
import api from '../api/axiosConfig'
import './Navbar.css'

const CATEGORIAS_PRODUCTOS = [
  { valor: 'parrilla', etiqueta: 'Parrillas' },
  { valor: 'asador', etiqueta: 'Asadores' },
  { valor: 'rejilla', etiqueta: 'Rejillas' },
  { valor: 'accesorio', etiqueta: 'Accesorios' },
  { valor: 'otro', etiqueta: 'Otros' }
]

function Navbar({ titulo, links }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [usuario, setUsuario] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false)
  const [tienePedidos, setTienePedidos] = useState(false)
  const { cartQuantity } = useCart()

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    setUsuario(usuarioGuardado ? JSON.parse(usuarioGuardado) : null)
  }, [location.pathname])

  // "Mis pedidos" solo debe verse si el cliente ya tiene al menos un pedido.
  // Se consulta una sola vez por sesión de usuario (no en cada cambio de ruta).
  useEffect(() => {
    if (!usuario || usuario.rol === 'admin') {
      setTienePedidos(false)
      return
    }

    const token = getToken()
    api.get('/ordenes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTienePedidos(res.data.length > 0))
      .catch(() => setTienePedidos(false))
  }, [usuario?.id])

  useEffect(() => {
    if (!menuMobileAbierto) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuMobileAbierto(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuMobileAbierto])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setMenuAbierto(false)
    setMenuMobileAbierto(false)
    navigate('/')
  }

  const cerrarMenuMobile = () => setMenuMobileAbierto(false)

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">{titulo}</Link>
      </div>

      <ul className="navbar-links">
        {links.map((link, index) => (
          <li key={index} className={link.ruta === '/productos' ? 'navbar-item-productos' : undefined}>
            <Link to={link.ruta}>{link.nombre}</Link>
            {link.ruta === '/productos' && (
              <div className="navbar-submenu">
                {CATEGORIAS_PRODUCTOS.map(cat => (
                  <Link key={cat.valor} to={`/productos?categoria=${cat.valor}`}>
                    {cat.etiqueta}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
        {getRol() === 'admin' && (
          <li><Link to="/usuarios">Usuarios</Link></li>
        )}
        {usuario && (usuario.rol === 'admin' || tienePedidos) && (
          <li>
            <Link to="/pedidos">
              {usuario.rol === 'admin' ? 'Pedidos' : 'Mis pedidos'}
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-actions">
        <Link to="/carrito" className="navbar-cart">
          <FiShoppingCart className="navbar-cart-icon" />
          <span className="navbar-cart-texto">Carrito</span>
          <span className="cart-badge">{cartQuantity}</span>
        </Link>
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

        <button
          className="navbar-hamburger"
          aria-label={menuMobileAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={menuMobileAbierto}
          onClick={() => setMenuMobileAbierto(!menuMobileAbierto)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div
        className={`navbar-overlay ${menuMobileAbierto ? 'visible' : ''}`}
        onClick={cerrarMenuMobile}
      />

      <div className={`navbar-mobile-menu ${menuMobileAbierto ? 'open' : ''}`}>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <Link to={link.ruta} onClick={cerrarMenuMobile}>{link.nombre}</Link>
            </li>
          ))}
          {getRol() === 'admin' && (
            <li><Link to="/usuarios" onClick={cerrarMenuMobile}>Usuarios</Link></li>
          )}
          {usuario && (usuario.rol === 'admin' || tienePedidos) && (
            <li>
              <Link to="/pedidos" onClick={cerrarMenuMobile}>
                {usuario.rol === 'admin' ? 'Pedidos' : 'Mis pedidos'}
              </Link>
            </li>
          )}
          <li className="navbar-mobile-divider"></li>
          {usuario ? (
            <>
              <li className="dropdown-nombre">{usuario.nombre}</li>
              <li><Link to="/perfil" onClick={cerrarMenuMobile}>Mi perfil</Link></li>
              <li><button onClick={handleLogout}>Cerrar sesión</button></li>
            </>
          ) : (
            <li><Link to="/login" onClick={cerrarMenuMobile}>Iniciar sesión</Link></li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
