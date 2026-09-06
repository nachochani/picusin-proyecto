import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/productos/${id}`)
      .then(response => {
        setProducto(response.data)
        setCargando(false)
      })
      .catch(() => {
        setError('Producto no encontrado')
        setCargando(false)
      })
  }, [id])

  const handleReservar = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    try {
      await axios.post(`http://127.0.0.1:8000/api/reservation?user_id=5&product_id=${id}`)
      setMensaje(`Reserva creada correctamente. Seña a pagar: $${(producto.precio * 0.10).toFixed(2)}`)
    } catch (_) {
      setError('No se pudo crear la reserva. El producto puede estar reservado.')
    }
  }

  if (cargando) return <div className="text-center mt-20">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← Volver
        </button>

        {producto && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <img
              src={producto.imagen_url || 'https://via.placeholder.com/600x400?text=Sin+imagen'}
              alt={producto.nombre}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-800">{producto.nombre}</h1>
              <p className="text-gray-500 mt-2">{producto.descripcion}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold" style={{color: '#FF4DB8'}}>
                  ${producto.precio}
                </span>
                <p className="text-gray-400 text-sm mt-1">
                  Seña: ${(producto.precio * 0.10).toFixed(2)}
                </p>
              </div>

              {mensaje && <p className="text-green-500 mt-4 font-semibold">{mensaje}</p>}
              {error && <p className="text-red-500 mt-4">{error}</p>}

              {producto.estado === 'disponible' ? (
                <button
                  onClick={handleReservar}
                  className="mt-6 w-full py-3 rounded-xl text-white font-bold text-lg hover:opacity-90"
                  style={{backgroundColor: '#4DD9E8'}}
                >
                  Reservar
                </button>
              ) : (
                <div
                  className="mt-6 w-full py-3 rounded-xl text-white font-bold text-lg text-center"
                  style={{backgroundColor: '#ccc'}}
                >
                  Producto reservado
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail