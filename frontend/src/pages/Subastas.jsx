
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function Subastas() {
  const [subastas, setSubastas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarSubastas = async () => {
      try {
        const respuesta = await api.get('/api/subastas')
        setSubastas(respuesta.data)
      } catch (err) {
        console.error(err)
        setError('No se pudieron cargar las subastas.')
      } finally {
        setCargando(false)
      }
    }

    cargarSubastas()
  }, [])

  const formatoPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(precio)

  const formatoFecha = (fecha) =>
    String(fecha).slice(0, 10).split('-').reverse().join('/')

  const estadoTexto = (estado) =>
    estado === 'activa'
      ? 'Activa'
      : estado === 'finalizada'
        ? 'Finalizada'
        : 'Cancelada'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <header className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-3"
            style={{ color: '#FF4DB8' }}
          >
            Subastas
          </h1>

          <p className="text-gray-500">
            Descubrí los productos disponibles y seguí las ofertas.
          </p>
        </header>

        {cargando && (
          <p className="text-center text-gray-400 py-10">
            Cargando subastas...
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
            {error}
          </div>
        )}

        {!cargando && !error && subastas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <p className="text-gray-500">
              No hay subastas disponibles por el momento.
            </p>
          </div>
        )}

        {!cargando && !error && subastas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subastas.map((subasta) => (
              <article
                key={subasta.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >

                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {subasta.imagen && subasta.imagen.includes('instagram') ? (
                    <a
                    href={subasta.imagen}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-full flex items-center justify-center hover:bg-gray-200 transition"
                    >
                    <span className="text-gray-500 font-semibold">
                        📷 Ver imagen
                    </span>
                    </a>
                ) : subasta.imagen ? (
                    <img
                    src={subasta.imagen}
                    alt={subasta.producto}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling.style.display = 'flex'
                    }}
                    />
                ) : null}

                <div
                    className="w-full h-full items-center justify-center text-gray-400"
                    style={{
                    display: subasta.imagen ? 'none' : 'flex',
                    }}
                >
                    <span className="text-5xl" aria-hidden="true">📦</span>
                    <span className="sr-only">Producto sin imagen</span>
                </div>
                </div>


                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h2 className="text-xl font-bold text-gray-800">
                      {subasta.producto}
                    </h2>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        subasta.estado === 'activa'
                          ? 'bg-green-100 text-green-700'
                          : subasta.estado === 'finalizada'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {estadoTexto(subasta.estado)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-1">
                    Precio actual
                  </p>

                  <p
                    className="text-2xl font-bold mb-4 break-words"
                    style={{ color: '#FF4DB8' }}
                  >
                    {formatoPrecio(subasta.precio_actual)}
                  </p>

                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Precio base:</span>{' '}
                      {formatoPrecio(subasta.precio_base)}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Finaliza:</span>{' '}
                      {formatoFecha(subasta.fecha_fin)}
                    </p>
                  </div>

                  <div className="mt-auto pt-5">
                    {subasta.estado === 'activa' ? (
                      <Link
                        to={`/subasta/${subasta.id}`}
                        className="block w-full text-center px-4 py-3 rounded-full text-white font-semibold hover:opacity-90 transition"
                        style={{ backgroundColor: '#4DD9E8' }}
                      >
                        Ver subasta y ofertar
                      </Link>
                    ) : (
                      <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        <p className="font-semibold">
                          {subasta.ganador_id
                            ? `Ganador: usuario ${subasta.ganador_id}`
                            : 'Finalizó sin ganador'}
                        </p>

                        <Link
                          to={`/subasta/${subasta.id}`}
                          className="inline-block mt-2 font-semibold hover:underline"
                          style={{ color: '#FF4DB8' }}
                        >
                          Ver detalles
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Subastas
