function ProductCard({ producto }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img
        src={producto.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+imagen'}
        alt={producto.nombre}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800">{producto.nombre}</h2>
        <p className="text-gray-500 text-sm mt-1">{producto.descripcion}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold" style={{color: '#FF4DB8'}}>
            ${producto.precio}
          </span>
          <button
            className="px-4 py-2 rounded-full text-white font-semibold hover:opacity-90"
            style={{backgroundColor: '#4DD9E8'}}
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard