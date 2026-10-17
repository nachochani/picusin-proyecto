
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function ProductCard({ producto }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { carrito, agregarAlCarrito } = useCart()

  const esReservable = producto.es_novedad || producto.es_preventa
  const yaEstaEnCarrito = carrito.some(
    (item) => item.id === producto.id
  )

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img
        src={producto.imagen || 'https://via.placeholder.com/300x200?text=Sin+imagen'}
        alt={producto.nombre}
        className="w-full h-48 object-contain"
      />

      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800">
          {producto.nombre}
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          {producto.descripcion}
        </p>

        <div className="flex justify-between items-center mt-4">
          <span
            className="text-xl font-bold"
            style={{ color: '#FF4DB8' }}
          >
            ${producto.precio}
          </span>

          <button
            onClick={() =>
              navigate(`/producto/${producto.id}`, {
                state: {
                  volverA: location.pathname + location.search + location.hash
                }
              })
            }
            className="px-4 py-2 rounded-full text-white font-semibold hover:opacity-90"
            style={{ backgroundColor: '#4DD9E8' }}
          >
            Ver producto
          </button>
        </div>

        {!esReservable && (
          <button
            onClick={() => agregarAlCarrito(producto)}
            disabled={
              yaEstaEnCarrito ||
              !producto.activo ||
              producto.estado !== 'disponible' ||
              producto.stock < 1
            }
            className="w-full mt-3 px-4 py-2 rounded-full text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF4DB8' }}
          >
            {yaEstaEnCarrito
              ? 'Agregado al carrito'
              : producto.stock < 1 || producto.estado !== 'disponible'
                ? 'Sin stock'
                : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard


