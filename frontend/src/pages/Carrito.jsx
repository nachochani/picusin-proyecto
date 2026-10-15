
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'

function Carrito() {
  const navigate = useNavigate()
  const { carrito, total, quitarDelCarrito, vaciarCarrito } = useCart()
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')



    async function confirmarCompra() {
    if (!localStorage.getItem('token')) {
        navigate('/login')
        return
    }

    if (carrito.length === 0 || procesando) return

    setProcesando(true)
    setMensaje('')
    setTipoMensaje('')


    try {
    await api.post('/api/pedidos/demo', {
        items: carrito.map((item) => ({
        product_id: item.id,
        cantidad: item.cantidad
        }))
    })

    vaciarCarrito()
    setMensaje('¡Compra realizada con éxito! Redirigiendo a Mis pedidos...')
    setTipoMensaje('exito')

    setTimeout(() => {
        navigate('/mis-pedidos')
    }, 1500)
    } catch (error) {
    setMensaje(
        error.response?.data?.detail ||
        'No se pudo completar la compra. Revisá la disponibilidad de los productos.'
    )
    setTipoMensaje('error')
    } finally {
    setProcesando(false)
    }

    }



  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Mi carrito
        </h1>

        {mensaje && (
          <p
            className={`mb-4 p-3 rounded-xl ${
              tipoMensaje === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {mensaje}
          </p>
        )}

        {carrito.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no agregaste productos al carrito.
            </p>

            <button
              onClick={() => navigate('/productos')}
              className="px-5 py-2 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#4DD9E8' }}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow p-4 flex items-center gap-4"
                >
                  <img
                    src={
                      item.imagen ||
                      'https://via.placeholder.com/100x100?text=Sin+imagen'
                    }
                    alt={item.nombre}
                    className="w-20 h-20 object-contain"
                  />

                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">
                      {item.nombre}
                    </h2>
                    <p className="text-gray-500">
                      Cantidad: {item.cantidad}
                    </p>
                    <p style={{ color: '#FF4DB8' }} className="font-bold">
                      ${item.precio * item.cantidad}
                    </p>
                  </div>

                  <button
                    onClick={() => quitarDelCarrito(item.id)}
                    className="px-3 py-2 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow p-6 mt-6">
              <div className="flex justify-between items-center mb-5">
                <span className="text-lg font-semibold">Total</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#FF4DB8' }}
                >
                  ${total}
                </span>
              </div>

              <button
                onClick={confirmarCompra}
                disabled={procesando}
                className="w-full px-5 py-3 rounded-full text-white font-bold disabled:opacity-50"
                style={{ backgroundColor: '#FF4DB8' }}
              >
                {procesando
                  ? 'Procesando compra...'
                  : 'Confirmar compra de prueba'}
              </button>

              <button
                onClick={vaciarCarrito}
                disabled={procesando}
                className="w-full mt-3 px-5 py-2 rounded-full font-semibold text-gray-600 hover:bg-gray-100"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default Carrito
