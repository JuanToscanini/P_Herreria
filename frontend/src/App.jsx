import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'
import Users from './pages/Users'
import Profile from './pages/Profile'
import EditProduct from './pages/EditProduct'
import EditUser from './pages/EditUser'
import NewProduct from './pages/NewProduct'
import { CartProvider } from './context/CartContext'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import './App.css'

const links = [
  { nombre: 'Inicio', ruta: '/' },
  { nombre: 'Productos', ruta: '/productos' },
  { nombre: 'Contacto', ruta: '/contacto' }
]

function App() {
  return (
    <CartProvider>
      <div className="app">
        <Navbar
          titulo="Herrería Ledesma"
          links={links}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/productos" element={<ProductList />} />
            <Route path="/productos/nuevo" element={<NewProduct />} />
            <Route path="/productos/:id" element={<ProductDetail />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/productos/editar/:id" element={<EditProduct />} />

            <Route path="/contacto" element={<Contact />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/usuarios/editar/:id" element={<EditUser />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer empresa="Herrería Ledesma" anio={2026} />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </CartProvider>
  )
}

export default App