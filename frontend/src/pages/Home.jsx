import { Link } from 'react-router-dom'
import FeaturedProducts from '../components/FeaturedProducts'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <p className="home-subtitulo">Herrería artesanal</p>
        <h1>Parrillas, asadores y rejillas<br/>de alta calidad</h1>
        <p className="home-descripcion">Fabricación artesanal con más de 20 años de experiencia en el rubro.</p>
        <Link to="/productos" className="home-btn">Ver productos</Link>
      </div>

      <FeaturedProducts />

      <div className="home-stats">
        <div className="home-stat">
          <p className="stat-numero">+20 años</p>
          <p className="stat-label">de experiencia</p>
        </div>
        <div className="home-stat">
          <p className="stat-numero">100% artesanal</p>
          <p className="stat-label">fabricación propia</p>
        </div>
        <div className="home-stat">
          <p className="stat-numero">Envíos</p>
          <p className="stat-label">a todo el país</p>
        </div>
      </div>
    </div>
  )
}

export default Home