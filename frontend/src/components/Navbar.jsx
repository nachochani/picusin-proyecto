
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Navbar() {
  const navigate = useNavigate()
  const { carrito } = useCart()
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false)

  const token = localStorage.getItem('token')
  const esAdmin = localStorage.getItem('es_admin') === 'true'

  const cantidadProductos = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('es_admin')
    setMenuCuentaAbierto(false)
    navigate('/')
  }

  const irA = (ruta) => {
    setMenuCuentaAbierto(false)
    navigate(ruta)
  }

  return (
    <nav
      style={{ backgroundColor: '#4DD9E8' }}
      className="px-6 py-4 flex justify-between items-center shadow-md gap-4 flex-wrap"
    >
      <h1
        className="text-2xl font-bold cursor-pointer whitespace-nowrap"
        style={{ color: '#FF4DB8' }}
        onClick={() => irA('/')}
      >
        Picusín Mangas
      </h1>

      <div className="flex gap-4 items-center flex-wrap">
        <button
          onClick={() => irA('/')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Novedades
        </button>

        <button
          onClick={() => irA('/productos')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Productos
        </button>

        <button
          onClick={() => irA('/subastas')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Subastas
        </button>

        {token && !esAdmin && (
          <>
            <button
              onClick={() => irA('/carrito')}
              className="text-white font-semibold hover:text-pink-200"
            >
              Carrito ({cantidadProductos})
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuCuentaAbierto(!menuCuentaAbierto)}
                aria-expanded={menuCuentaAbierto}
                className="bg-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:opacity-90"
                style={{ color: '#FF4DB8' }}
              >
                <span>Mi cuenta</span>
                <span>{menuCuentaAbierto ? '▲' : '▼'}</span>
              </button>

              {menuCuentaAbierto && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-pink-100">
                  <button
                    onClick={() => irA('/mis-pedidos')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-pink-50"
                  >
                    Mis pedidos
                  </button>

                  <button
                    onClick={() => irA('/mis-subastas')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-pink-50"
                  >
                    Mis subastas
                  </button>

                  <button
                    onClick={() => irA('/mis-reservas')}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-pink-50"
                  >
                    Mis reservas
                  </button>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 font-semibold hover:bg-pink-50"
                      style={{ color: '#FF4DB8' }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {token && esAdmin && (
          <>
            <button
              onClick={() => irA('/admin')}
              className="text-white font-semibold hover:text-pink-200"
            >
              Panel Admin
            </button>

            <button
              onClick={handleLogout}
              className="bg-white px-4 py-1 rounded-full font-semibold hover:opacity-90"
              style={{ color: '#FF4DB8' }}
            >
              Cerrar sesión
            </button>
          </>
        )}

        {!token && (
          <button
            onClick={() => irA('/login')}
            className="bg-white px-4 py-1 rounded-full font-semibold hover:opacity-90"
            style={{ color: '#FF4DB8' }}
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
