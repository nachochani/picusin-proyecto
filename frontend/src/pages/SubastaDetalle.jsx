
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function SubastaDetalle() {
  const { id } = useParams()

  const [subasta, setSubasta] = useState(null)
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargarSubasta = async () => {
    try {
      const respuesta = await api.get(`/api/subastas/${id}`)
      setSubasta(respuesta.data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la subasta.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarSubasta()
  }, [id])

  const formatoPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(precio)

  const formatoFecha = (fecha) =>
    String(fecha).slice(0, 10).split('-').reverse().join('/')

  const ofertar = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    const valor = Number(monto)

    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Ingresá un importe válido.')
      return
    }

    const minimo = Number(subasta.precio_actual) + 1000

    if (valor < minimo) {
      setError(`La puja mínima es de ${formatoPrecio(minimo)}.`)
      return
    }

    setEnviando(true)

    try {
      await api.post(
        `/api/subastas/${id}/pujas?monto=${encodeURIComponent(valor)}`
      )
      setMensaje('¡Tu puja se registró correctamente!')
      setMonto('')
      await cargarSubasta()
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'No se pudo registrar la puja. Revisá que hayas iniciado sesión.'
      )
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-400">Cargando subasta...</p>
        </main>
      </div>
    )
  }

  if (!subasta) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <p className="text-red-500 mb-4">
            {error || 'Subasta no encontrada.'}
          </p>
          <Link
            to="/subastas"
            className="font-semibold hover:underline"
            style={{ color: '#FF4DB8' }}
          >
            ← Volver a las subastas
          </Link>
        </main>
      </div>
    )
  }

  const estadoTexto =
    subasta.estado === 'activa'
      ? 'Activa'
      : subasta.estado === 'finalizada'
        ? 'Finalizada'
        : 'Cancelada'

  const token = localStorage.getItem('token')
  const precioMinimo = Number(subasta.precio_actual) + 1000

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/subastas"
          className="inline-block mb-6 font-semibold hover:underline"
          style={{ color: '#FF4DB8' }}
        >
          ← Volver a las subastas
        </Link>

        <div className="mb-6">
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: '#FF4DB8' }}
          >
            {subasta.producto}
          </h1>
          
        <div className="w-full max-w-2xl h-64 md:h-80 mb-5 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
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
            className="w-full h-full object-contain"
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


          <span
            className={`inline-block rounded-full px-4 py-1 text-sm font-bold ${
              subasta.estado === 'activa'
                ? 'bg-green-100 text-green-700'
                : subasta.estado === 'finalizada'
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {estadoTexto}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <section className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-500 font-medium mb-2">Precio actual</p>

            <p
              className="text-3xl md:text-4xl font-bold break-words"
              style={{ color: '#FF4DB8' }}
            >
              {formatoPrecio(subasta.precio_actual)}
            </p>

            <div className="border-t border-gray-100 mt-5 pt-4">
              <p className="text-gray-500 text-sm">Precio base</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatoPrecio(subasta.precio_base)}
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Información de la subasta
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Fecha de inicio</p>
                <p className="font-semibold text-gray-800">
                  {formatoFecha(subasta.fecha_inicio)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha de finalización</p>
                <p className="font-semibold text-gray-800">
                  {formatoFecha(subasta.fecha_fin)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {subasta.estado === 'activa' && (
          <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Realizar una puja
            </h2>

            <p className="text-gray-500 text-sm mb-5">
              Tu oferta debe superar el precio actual por al menos $1.000.
            </p>

            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#FFF0F9' }}>
              <p className="text-sm text-gray-600">Tu puja mínima</p>
              <p className="text-2xl font-bold" style={{ color: '#FF4DB8' }}>
                {formatoPrecio(precioMinimo)}
              </p>
            </div>

            <form onSubmit={ofertar}>
              <label
                htmlFor="monto"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Tu oferta en pesos
              </label>

              <input
                id="monto"
                type="number"
                min={precioMinimo}
                step="1"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="Ingresá el monto de tu oferta"
              />

              <button
                type="submit"
                disabled={enviando}
                className="block mt-4 px-6 py-3 rounded-full text-white font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#4DD9E8' }}
              >
                {enviando ? 'Enviando...' : 'Realizar puja'}
              </button>
            </form>

            {!token && (
              <p className="mt-4 text-sm text-gray-500">
                Para ofertar, primero tenés que{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: '#FF4DB8' }}
                >
                  iniciar sesión
                </Link>.
              </p>
            )}
          </section>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6">
            {mensaje}
          </div>
        )}

        {subasta.estado === 'finalizada' && (
          <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Resultado de la subasta
            </h2>
            <p className="text-gray-600">
              <strong>Ganador:</strong>{' '}
              {subasta.ganador_id
                ? `Usuario ${subasta.ganador_id}`
                : 'La subasta finalizó sin pujas.'}
            </p>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Historial de pujas
            </h2>
            <span className="text-sm text-gray-500">
              {subasta.pujas.length}{' '}
              {subasta.pujas.length === 1 ? 'puja' : 'pujas'}
            </span>
          </div>

          {subasta.pujas.length === 0 ? (
            <p className="text-gray-400 py-4">
              Todavía no hay pujas para esta subasta.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {subasta.pujas.map((puja, index) => (
                <li
                  key={puja.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm"
                      style={{
                        backgroundColor: index === 0 ? '#FFF0F9' : '#F3F4F6',
                        color: index === 0 ? '#FF4DB8' : '#6B7280',
                      }}
                    >
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-bold text-gray-800">
                        {formatoPrecio(puja.monto)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Usuario {puja.usuario_id}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 sm:text-right">
                    {puja.creado_en
                      ? String(puja.creado_en).replace('T', ' ').slice(0, 19)
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default SubastaDetalle
