import { Link } from 'react-router-dom'
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa'
import { FiCreditCard } from 'react-icons/fi'
import './Footer.css'

function Footer({ empresa, anio }) {
  return (
    <footer className="footer">
      <div className="footer-columns">
       

        <div className="footer-col">
          <h4 className="footer-col-title">Navegación</h4>
          <ul className="footer-links">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/productos">Productos</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/pedidos">Mis pedidos</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Contacto</h4>
          <ul className="footer-contact">
            <li>
              {/* PLACEHOLDER: confirmar que este numero tiene WhatsApp activo */}
              <a href="https://wa.me/5493442319059" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp /> +54 3442 319059
              </a>
            </li>
            <li>📧 herrerialedesma@gmail.com</li>
            <li>📍 Carosini 723, Concepción del Uruguay, Entre Ríos</li>
            
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Nuestras redes</h4>
          <div className="footer-social">
            {/* PLACEHOLDER: reemplazar href por la URL real de Instagram */}
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-icon">
              <FaInstagram />
            </a>
            {/* PLACEHOLDER: reemplazar href por la URL real de Facebook */}
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social-icon">
              <FaFacebook />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        <p className="footer-copyright">© {anio} {empresa} - Todos los derechos reservados</p>
        <div className="footer-payment">
          <FiCreditCard />
          <span>MercadoPago</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
