
import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

function Productos() {
  const [productos, setProductos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const categorias = [
    'Todas',
    'Figuras',
    'Peluches',
    'TCG',
    'Revistas',
    'Mangas',
    'Artbooks y guías',
    'Música',
    'Gachapones',
    'Otros'
  ]

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/productos')
      .then(response => {
        const catalogo = response.data.filter(
          producto =>
            producto.es_novedad === false ||
            producto.es_novedad === 0
        )

        setProductos(catalogo)
      })
      .catch(error => {
        console.error('Error al cargar el catálogo:', error)
        setError(true)
      })
      .finally(() => {
        setCargando(false)
      })
  }, [])

  const productosFiltrados = productos.filter(producto =>
    categoriaSeleccionada === 'Todas' ||
    producto.categoria === categoriaSeleccionada
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1
          className="text-4xl font-bold text-center mb-2"
          style={{ color: '#FF4DB8' }}
        >
          Nuestro catálogo
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Descubrí todos los productos disponibles de Picusín Mangas
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categorias.map(categoria => (
            <button
              key={categoria}
              onClick={() => setCategoriaSeleccionada(categoria)}
              className="px-5 py-2 rounded-full font-semibold transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor:
                  categoriaSeleccionada === categoria
                    ? '#FF4DB8'
                    : '#FFFFFF',
                color:
                  categoriaSeleccionada === categoria
                    ? '#FFFFFF'
                    : '#555555',
                border: `2px solid ${
                  categoriaSeleccionada === categoria
                    ? '#FF4DB8'
                    : '#4DD9E8'
                }`
              }}
            >
              {categoria}
            </button>
          ))}
        </div>

        {cargando ? (
          <p className="text-center text-gray-400">
            Cargando productos...
          </p>
        ) : error ? (
          <p className="text-center text-red-500">
            No se pudieron cargar los productos. Intentá nuevamente.
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400">
            No hay productos en esta categoría.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {productosFiltrados.length}{' '}
              {productosFiltrados.length === 1
                ? 'producto'
                : 'productos'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosFiltrados.map(producto => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Productos

