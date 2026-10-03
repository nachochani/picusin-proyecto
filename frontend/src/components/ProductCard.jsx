import { useNavigate } from 'react-router-dom'

function ProductCard({ producto }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {producto.imagen && producto.imagen.includes('instagram') ? (
        <a 
          href={producto.imagen} 
          target="_blank" 
          rel="noreferrer"
          className="w-full h-48 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition"
        >
          <span className="text-gray-500 font-semibold">📷 Ver imagen</span>
        </a>
      ) : (
        <img
          src={producto.imagen || 'https://via.placeholder.com/300x200?text=Sin+imagen'}
          alt={producto.nombre}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800">{producto.nombre}</h2>
        <p className="text-gray-500 text-sm mt-1">{producto.descripcion}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold" style={{color: '#FF4DB8'}}>
            ${producto.precio}
          </span>
          <button
            onClick={() => navigate(`/producto/${producto.id}`)}
            className="px-4 py-2 rounded-full text-white font-semibold hover:opacity-90"
            style={{backgroundColor: '#4DD9E8'}}
          >
            Ver producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard