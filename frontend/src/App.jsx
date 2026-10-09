import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Admin from './pages/Admin'
import AdminProducto from './pages/AdminProducto'
import Subastas from './pages/Subastas'
import SubastaDetalle from './pages/SubastaDetalle'

function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  )
}

export default App