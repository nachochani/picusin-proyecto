
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Navbar() {
  const navigate = useNavigate()
  const { carrito } = useCart()

  const token = localStorage.getItem('token')
  const esAdmin = localStorage.getItem('es_admin') === 'true'

  const cantidadProductos = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('es_admin')
    navigate('/')
  }

  return (
    <nav
      style={{ backgroundColor: '#4DD9E8' }}
      className="px-6 py-4 flex justify-between items-center shadow-md"
    >
      <h1
        className="text-2xl font-bold cursor-pointer"
        style={{ color: '#FF4DB8' }}
        onClick={() => navigate('/')}
      >
        Picusín Mangas
      </h1>

      <div className="flex gap-4 items-center flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Novedades
        </button>

        <button
          onClick={() => navigate('/productos')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Productos
        </button>

        <button
          onClick={() => navigate('/subastas')}
          className="text-white font-semibold hover:text-pink-200"
        >
          Subastas
        </button>

        {token && !esAdmin && (
          <>
            <button
              onClick={() => navigate('/carrito')}
              className="text-white font-semibold hover:text-pink-200"
            >
              Carrito ({cantidadProductos})
            </button>

            <button
              onClick={() => navigate('/mis-pedidos')}
              className="text-white font-semibold hover:text-pink-200"
            >
              Mis pedidos
            </button>
          </>
        )}

        {token && esAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="text-white font-semibold hover:text-pink-200"
          >
            Panel Admin
          </button>
        )}

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-white px-4 py-1 rounded-full font-semibold hover:opacity-90"
            style={{ color: '#FF4DB8' }}
          >
            Cerrar sesión
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
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
