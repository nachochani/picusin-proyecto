
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function MisSubastas() {
  const navigate = useNavigate()
  const [subastas, setSubastas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    async function cargarSubastas() {
      if (!localStorage.getItem('token')) {
        navigate('/login')
        return
      }

      try {
        const respuesta = await api.get('/api/mis-subastas')
        setSubastas(respuesta.data)
      } catch (error) {
        setMensaje(
          error.response?.data?.detail ||
          'No se pudieron cargar tus subastas.'
        )
      } finally {
        setCargando(false)
      }
    }

    cargarSubastas()
  }, [navigate])

  const formatoFecha = (fecha) => {
    if (!fecha) return 'No disponible'
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const estiloResultado = (resultado) => {
    if (resultado === 'Ganada' || resultado === 'Vas ganando') {
      return 'bg-green-100 text-green-700'
    }

    if (resultado === 'Superado') {
      return 'bg-yellow-100 text-yellow-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Mis subastas
        </h1>

        {cargando ? (
          <p className="text-gray-600">Cargando tus subastas...</p>
        ) : mensaje ? (
          <p className="bg-red-100 text-red-700 p-3 rounded-xl">
            {mensaje}
          </p>
        ) : subastas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no participaste en ninguna subasta.
            </p>

            <button
              onClick={() => navigate('/subastas')}
              className="px-5 py-2 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#4DD9E8' }}
            >
              Ver subastas
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {subastas.map((subasta) => (
              <div
                key={subasta.id}
                className="bg-white rounded-2xl shadow-md p-5"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  <img
                    src={
                      subasta.imagen ||
                      'https://via.placeholder.com/140x140?text=Sin+imagen'
                    }
                    alt={subasta.producto}
                    className="w-32 h-32 object-contain self-center"
                  />

                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <h2 className="text-lg font-bold text-gray-800">
                        {subasta.producto}
                      </h2>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold h-fit ${estiloResultado(subasta.resultado)}`}
                      >
                        {subasta.resultado}
                      </span>
                    </div>

                    <p className="text-gray-600">
                      Tu última puja: ${subasta.mi_ultima_puja}
                    </p>

                    <p className="text-gray-600">
                      Precio actual: ${subasta.precio_actual}
                    </p>

                    <p className="text-gray-600">
                      Cantidad de pujas realizadas: {subasta.cantidad_pujas}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      Finalización: {formatoFecha(subasta.fecha_fin)}
                    </p>

                    <button
                      onClick={() => navigate(`/subasta/${subasta.id}`)}
                      className="mt-4 px-4 py-2 rounded-full text-white font-semibold"
                      style={{ backgroundColor: '#FF4DB8' }}
                    >
                      Ver subasta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default MisSubastas
