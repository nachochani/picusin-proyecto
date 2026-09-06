import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

function Home() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/productos')
      .then(response => {
        setProductos(response.data)
        setCargando(false)
      })
      .catch(error => {
        console.error("Error al cargar productos", error)
        setCargando(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2" style={{color: '#FF4DB8'}}>
          Novedades de la semana
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Reservá tus productos antes del viernes
        </p>

        {cargando ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-center text-gray-400">No hay productos disponibles esta semana</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map(producto => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Home