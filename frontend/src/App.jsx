import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

import './App.css'

const links = [
  { nombre: 'Inicio', ruta: '/' },
  { nombre: 'Productos', ruta: '/productos' },
  { nombre: 'Contacto', ruta: '/contacto' }
]

function App() {
  return (
    <div className="app">
      <Navbar
        titulo="Herrería Ledesma"
        links={links}
        cantidadCarrito={0}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ProductList />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer empresa="Herrería Ledesma" anio={2026} />
      <Footer />

    </div>
  )
}

export default App