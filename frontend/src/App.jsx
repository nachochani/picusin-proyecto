import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Admin from './pages/Admin'
import AdminProducto from './pages/AdminProducto'
import Subastas from './pages/Subastas'
import SubastaDetalle from './pages/SubastaDetalle'
import Productos from './pages/Productos'
import Carrito from './pages/Carrito'
import { CartProvider } from './context/CartContext'
import MisPedidos from './pages/MisPedidos'
import MisReservas from './pages/MisReservas'
import MisSubastas from './pages/MisSubastas'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/producto/:id" element={<AdminProducto />} />
          <Route path="/subastas" element={<Subastas />} />
          <Route path="/subasta/:id" element={<SubastaDetalle />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/mis-reservas" element={<MisReservas />} />
          <Route path="/mis-subastas" element={<MisSubastas />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
