import { useState, useEffect } from 'react'
import api from '../../api'

function AdminReservas({ mostrarMensaje, pedirConfirmacion }) {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarReservas = async () => {
    try {
      const respuesta = await api.get('/admin/reservas')
      setReservas(respuesta.data)
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'Error al cargar las reservas',
        'error'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReservas()
  }, [])

  const handleCambiarEstadoReserva = async (id, estado) => {
    try {
      await api.put(
        `/admin/reservas/${id}/estado`,
        null,
        { params: { estado } }
      )

      await cargarReservas()

      mostrarMensaje(
        estado === 'confirmada'
          ? 'Reserva confirmada correctamente'
          : 'Reserva cancelada correctamente'
      )
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          (estado === 'confirmada'
            ? 'Error al confirmar la reserva'
            : 'Error al cancelar la reserva'),
        'error'
      )
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-700">
          Reservas
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Consultá y gestioná las reservas de los clientes.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: '#4DD9E8' }}>
            <tr>
              <th className="text-left px-4 py-3 text-white">ID</th>
              <th className="text-left px-4 py-3 text-white">Usuario</th>
              <th className="text-left px-4 py-3 text-white">Producto</th>
              <th className="text-left px-4 py-3 text-white">Seña</th>
              <th className="text-left px-4 py-3 text-white">Estado</th>
              <th className="text-left px-4 py-3 text-white">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center px-4 py-8 text-gray-500"
                >
                  Cargando reservas...
                </td>
              </tr>
            ) : (
              <>
                {reservas.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3">{r.user_id}</td>
                    <td className="px-4 py-3">{r.product_id}</td>
                    <td className="px-4 py-3">
                      ${Number(r.monto_senia || 0).toLocaleString('es-AR')}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.estado === 'confirmada'
                            ? 'bg-green-100 text-green-700'
                            : r.estado === 'pendiente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        {r.estado !== 'confirmada' &&
                          r.estado !== 'cancelada' && (
                            <button
                              type="button"
                              className="text-green-600 hover:text-green-800 hover:underline font-semibold text-sm"
                              onClick={() =>
                                handleCambiarEstadoReserva(r.id, 'confirmada')
                              }
                            >
                              Confirmar
                            </button>
                          )}

                        {r.estado !== 'cancelada' && (
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-600 hover:underline font-semibold text-sm"
                            onClick={() =>
                              pedirConfirmacion({
                                titulo: 'Cancelar reserva',
                                mensaje: `¿Seguro que querés cancelar la reserva #${r.id}? Esta acción cambiará su estado a cancelada.`,
                                textoBoton: 'Sí, cancelar reserva',
                                accion: () =>
                                  handleCambiarEstadoReserva(
                                    r.id,
                                    'cancelada'
                                  ),
                              })
                            }
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {reservas.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center px-4 py-8 text-gray-400"
                    >
                      No hay reservas para mostrar.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminReservas
