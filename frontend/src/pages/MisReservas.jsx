
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

const etapas = [
  { estado: 'pendiente', nombre: 'Pendiente' },
  { estado: 'confirmada', nombre: 'Confirmada' },
  { estado: 'solicitada', nombre: 'Solicitada' },
  { estado: 'recibida', nombre: 'Recibida' },
  { estado: 'enviada', nombre: 'Enviada' },
  { estado: 'entregada', nombre: 'Entregada' },
]

const coloresEstado = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  solicitada: 'bg-purple-100 text-purple-700',
  recibida: 'bg-cyan-100 text-cyan-700',
  enviada: 'bg-blue-100 text-blue-700',
  entregada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const formatearPrecio = (precio) => {
  return Number(precio || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })
}

const formatoFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible'

  return new Date(fecha).toLocaleDateString('es-AR')
}

// Seguimiento visual de la reserva
function SeguimientoReserva({ estado }) {
  const indiceActual = etapas.findIndex(
    (etapa) => etapa.estado === estado
  )

  if (estado === 'cancelada' || indiceActual === -1) {
    return null
  }

  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Seguimiento de tu reserva
      </h3>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[460px]">
          {etapas.map((etapa, indice) => {
            const completada =
              indice < indiceActual || estado === 'entregada'

            const actual = indice === indiceActual

            return (
              <div
                key={etapa.estado}
                className="flex-1 relative flex flex-col items-center"
              >
                {/* Línea entre etapas */}
                {indice < etapas.length - 1 && (
                  <div
                    className="absolute top-4 left-1/2 w-full h-1"
                    style={{
                      backgroundColor:
                        indice < indiceActual
                          ? '#4DD9E8'
                          : '#E5E7EB',
                    }}
                  />
                )}

                {/* Círculo de la etapa */}
                <div
                  className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    backgroundColor: completada
                      ? '#4DD9E8'
                      : actual
                        ? '#FF4DB8'
                        : '#D1D5DB',
                  }}
                >
                  {completada ? '✓' : indice + 1}
                </div>

                {/* Nombre de la etapa */}
                <span
                  className={`mt-2 text-xs text-center ${
                    actual
                      ? 'font-bold text-pink-500'
                      : completada
                        ? 'font-semibold text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {etapa.nombre}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Mensaje informativo según el estado
function InformacionReserva({ reserva }) {
  const mensajes = {
    pendiente: {
      titulo: 'Estamos esperando tu seña',
      descripcion:
        'Aboná el 10% del precio para confirmar tu reserva.',
    },
    confirmada: {
      titulo: '¡Recibimos tu seña!',
      descripcion:
        'Tu reserva está confirmada. Pronto solicitaremos el producto al proveedor.',
    },
    solicitada: {
      titulo: 'Tu producto fue solicitado',
      descripcion:
        'Estamos esperando recibir tu producto. Te avisaremos mediante el estado de tu reserva cuando esté disponible.',
    },
    recibida: {
      titulo: reserva.saldo_pagado
        ? '¡Recibimos el pago completo!'
        : '¡Tu producto ya llegó!',
      descripcion: reserva.saldo_pagado
        ? 'Estamos preparando tu producto para enviártelo.'
        : 'Ya podés abonar el saldo restante para continuar con el envío.',
    },
    enviada: {
      titulo: '¡Tu producto está en camino!',
      descripcion:
        'Tu producto ya fue enviado. Pronto podrás disfrutarlo.',
    },
    entregada: {
      titulo: '¡Reserva completada!',
      descripcion:
        'Tu producto fue entregado. Gracias por comprar en Picusín.',
    },
    cancelada: {
      titulo: 'Reserva cancelada',
      descripcion:
        'Esta reserva ya no se encuentra vigente.',
    },
  }

  const informacion = mensajes[reserva.estado]

  if (!informacion) return null

  const claseColor =
    reserva.estado === 'cancelada'
      ? 'bg-red-50 text-red-700'
      : reserva.estado === 'entregada'
        ? 'bg-green-50 text-green-700'
        : 'bg-cyan-50 text-cyan-800'

  return (
    <div className={`mt-5 p-4 rounded-xl ${claseColor}`}>
      <h3 className="font-semibold mb-1">
        {informacion.titulo}
      </h3>

      <p className="text-sm">
        {informacion.descripcion}
      </p>
    </div>
  )
}

function MisReservas() {
  const navigate = useNavigate()

  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [avisoPago, setAvisoPago] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    let activo = true
    let consultando = false

    async function cargarReservas() {
      if (consultando) return

      consultando = true

      try {
        const respuesta = await api.get('/api/mis-reservas')

        if (activo) {
          setReservas(respuesta.data)
          setMensaje('')
        }
      } catch (error) {
        if (activo) {
          setMensaje(
            error.response?.data?.detail ||
              'No se pudieron cargar tus reservas.'
          )
        }
      } finally {
        consultando = false

        if (activo) {
          setCargando(false)
        }
      }
    }

    // Primera carga
    cargarReservas()

    // Actualizar cada 5 segundos
    const intervalo = setInterval(cargarReservas, 5000)

    // Detener las consultas al salir de la página
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [navigate])
  // Función provisional hasta implementar los pagos
  const handlePagar = (reserva, tipo) => {
    setAvisoPago({
      reservaId: reserva.id,
      tipo,
      monto:
        tipo === 'senia'
          ? reserva.monto_senia
          : reserva.saldo_restante,
    })
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#FF4DB8' }}
        >
          Mis reservas
        </h1>

        <p className="text-gray-500 mb-6">
          Consultá el estado de tus reservas y realizá el
          seguimiento de tus productos.
        </p>

        {cargando ? (
          <p className="text-gray-600">
            Cargando tus reservas...
          </p>
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
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#4DD9E8' }}
            >
              Ver novedades
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reservas.map((reserva) => (
              <div
                key={reserva.id}
                className="bg-white rounded-2xl shadow-md p-5 sm:p-6"
              >
                {/* Información del producto */}
                <div className="flex flex-col sm:flex-row gap-5">
                  {reserva.imagen ? (
                    <img
                      src={reserva.imagen}
                      alt={reserva.producto}
                      className="w-32 h-32 object-contain self-center"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-400 self-center">
                      Sin imagen
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-800">
                        {reserva.producto}
                      </h2>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold capitalize h-fit ${
                          coloresEstado[reserva.estado] ||
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {reserva.estado}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                      Reserva #{reserva.id} ·{' '}
                      {formatoFecha(reserva.creado_en)}
                    </p>

                    <p className="text-sm text-gray-500">
                      Precio total
                    </p>

                    <p className="text-2xl font-bold text-gray-800">
                      {formatearPrecio(
                        reserva.precio_total ?? reserva.precio
                      )}
                    </p>
                  </div>
                </div>

                {/* Información de los pagos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">
                      Seña (10%)
                    </p>

                    <p className="text-lg font-bold text-gray-800">
                      {formatearPrecio(reserva.monto_senia)}
                    </p>

                    <p
                      className={`text-sm font-semibold mt-1 ${
                        reserva.senia_pagada
                          ? 'text-green-600'
                          : reserva.estado === 'cancelada'
                            ? 'text-gray-400'
                            : 'text-yellow-600'
                      }`}
                    >
                      {reserva.senia_pagada
                        ? '✓ Pagada'
                        : reserva.estado === 'cancelada'
                          ? 'Cancelada'
                          : 'Pendiente de pago'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">
                      Saldo restante (90%)
                    </p>

                    <p className="text-lg font-bold text-gray-800">
                      {formatearPrecio(reserva.saldo_restante)}
                    </p>

                    <p
                      className={`text-sm font-semibold mt-1 ${
                        reserva.saldo_pagado
                          ? 'text-green-600'
                          : reserva.estado === 'cancelada'
                            ? 'text-gray-400'
                            : reserva.puede_pagar_saldo
                              ? 'text-yellow-600'
                              : 'text-gray-500'
                      }`}
                    >
                      {reserva.saldo_pagado
                        ? '✓ Pagado'
                        : reserva.estado === 'cancelada'
                          ? 'Cancelado'
                          : reserva.puede_pagar_saldo
                            ? 'Pendiente de pago'
                            : 'Aún no habilitado'}
                    </p>
                  </div>
                </div>

                {/* Seguimiento visual */}
                <SeguimientoReserva estado={reserva.estado} />

                {/* Mensaje según el estado */}
                <InformacionReserva reserva={reserva} />

                {/* Botón para abonar la seña */}
                {reserva.estado === 'pendiente' &&
                  !reserva.senia_pagada && (
                    <button
                      type="button"
                      onClick={() => handlePagar(reserva, 'senia')}
                      className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#FF4DB8' }}
                    >
                      Abonar seña ·{' '}
                      {formatearPrecio(reserva.monto_senia)}
                    </button>
                  )}

                {/* Botón para abonar el saldo */}
                {reserva.puede_pagar_saldo && (
                  <button
                    type="button"
                    onClick={() => handlePagar(reserva, 'saldo')}
                    className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#FF4DB8' }}
                  >
                    Abonar saldo ·{' '}
                    {formatearPrecio(reserva.saldo_restante)}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal provisional de pago */}
      {avisoPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-pago"
          >
            <h2
              id="titulo-pago"
              className="text-xl font-bold text-gray-800 mb-2"
            >
              {avisoPago.tipo === 'senia'
                ? 'Abonar seña'
                : 'Abonar saldo restante'}
            </h2>

            <p className="text-sm text-gray-500">
              Reserva #{avisoPago.reservaId}
            </p>

            <p className="text-3xl font-bold text-gray-800 my-4">
              {formatearPrecio(avisoPago.monto)}
            </p>

            <p className="text-sm text-gray-600 mb-5">
              La funcionalidad de pagos todavía se encuentra
              en desarrollo.
            </p>

            <button
              type="button"
              onClick={() => setAvisoPago(null)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MisReservas
