
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function MisReservas() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    async function cargarReservas() {
      if (!localStorage.getItem('token')) {
        navigate('/login')
        return
      }

      try {
        const respuesta = await api.get('/api/mis-reservas')
        setReservas(respuesta.data)
      } catch (error) {
        setMensaje(
          error.response?.data?.detail ||
          'No se pudieron cargar tus reservas.'
        )
      } finally {
        setCargando(false)
      }
    }

    cargarReservas()
  }, [navigate])

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible'

    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const textoEstado = (estado) => {
    const estados = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    }

    return estados[estado] || estado
  }

  const colorEstado = (estado) => {
    if (estado === 'confirmada') {
      return 'bg-green-100 text-green-700'
    }

    if (estado === 'cancelada') {
      return 'bg-red-100 text-red-700'
    }

    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Mis reservas
        </h1>

        {cargando ? (
          <p className="text-gray-600">Cargando tus reservas...</p>
        ) : mensaje ? (
          <p className="bg-red-100 text-red-700 p-3 rounded-xl">
            {mensaje}
          </p>
        ) : reservas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no realizaste ninguna reserva.
            </p>

            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#4DD9E8' }}
            >
              Ver novedades
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((reserva) => (
              <div
                key={reserva.id}
                className="bg-white rounded-2xl shadow-md p-5 flex flex-col sm:flex-row gap-5"
              >
                <img
                  src={
                    reserva.imagen ||
                    'https://via.placeholder.com/120x120?text=Sin+imagen'
                  }
                  alt={reserva.producto}
                  className="w-28 h-28 object-contain self-center"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <h2 className="text-lg font-bold text-gray-800">
                      {reserva.producto}
                    </h2>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold h-fit ${colorEstado(reserva.estado)}`}
                    >
                      {textoEstado(reserva.estado)}
                    </span>
                  </div>

                  <p className="text-gray-600">
                    Precio del producto: ${reserva.precio}
                  </p>

                  <p className="font-semibold mt-1">
                    Seña del 10%: ${reserva.monto_senia}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Reserva #{reserva.id} ·{' '}
                    {formatoFecha(reserva.creado_en)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default MisReservas
