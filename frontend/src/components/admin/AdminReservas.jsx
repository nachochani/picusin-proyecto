
import { useState, useEffect } from 'react'
import api from '../../api'

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

function AdminReservas({ mostrarMensaje, pedirConfirmacion }) {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

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

  // Confirmar el pago de la seña
  const handleConfirmarSenia = (reserva) => {
    pedirConfirmacion({
      titulo: 'Confirmar pago de la seña',
      mensaje: `¿Confirmás que recibiste el pago de ${formatearPrecio(
        reserva.monto_senia
      )} correspondiente a la seña de la reserva #${reserva.id}?`,
      textoBoton: 'Confirmar seña',
      accion: async () => {
        await api.put(
          `/admin/reservas/${reserva.id}/confirmar-senia`
        )

        mostrarMensaje('Pago de la seña confirmado correctamente')
        await cargarReservas()
      },
    })
  }

  // Confirmar el pago del saldo restante
  const handleConfirmarSaldo = (reserva) => {
    pedirConfirmacion({
      titulo: 'Confirmar pago del saldo',
      mensaje: `¿Confirmás que recibiste el pago de ${formatearPrecio(
        reserva.saldo_restante
      )} correspondiente al saldo de la reserva #${reserva.id}?`,
      textoBoton: 'Confirmar saldo',
      accion: async () => {
        await api.put(
          `/admin/reservas/${reserva.id}/confirmar-saldo`
        )

        mostrarMensaje('Pago del saldo confirmado correctamente')
        await cargarReservas()
      },
    })
  }

  // Cambiar el estado de una reserva
  const handleCambiarEstadoReserva = (reserva, estado) => {
    const configuraciones = {
      solicitada: {
        titulo: 'Solicitar producto',
        mensaje: `¿Confirmás que solicitaste al proveedor el producto de la reserva #${reserva.id}?`,
        textoBoton: 'Confirmar solicitud',
        mensajeExito: 'Producto marcado como solicitado',
      },
      recibida: {
        titulo: 'Recibir producto',
        mensaje: `¿Confirmás que recibiste el producto de la reserva #${reserva.id}? El cliente podrá abonar el saldo restante.`,
        textoBoton: 'Confirmar recepción',
        mensajeExito: 'Producto marcado como recibido',
      },
      enviada: {
        titulo: 'Enviar producto',
        mensaje: `¿Confirmás que enviaste el producto de la reserva #${reserva.id} al cliente? El producto quedará marcado como vendido.`,
        textoBoton: 'Confirmar envío',
        mensajeExito: 'Producto marcado como enviado',
      },
      entregada: {
        titulo: 'Confirmar entrega',
        mensaje: `¿Confirmás que el cliente recibió el producto de la reserva #${reserva.id}?`,
        textoBoton: 'Confirmar entrega',
        mensajeExito: 'Reserva entregada correctamente',
      },
      cancelada: {
        titulo: 'Cancelar reserva',
        mensaje: `¿Seguro que querés cancelar la reserva #${reserva.id}?`,
        textoBoton: 'Sí, cancelar reserva',
        mensajeExito: 'Reserva cancelada correctamente',
      },
    }

    const config = configuraciones[estado]

    if (!config) return

    pedirConfirmacion({
      titulo: config.titulo,
      mensaje: config.mensaje,
      textoBoton: config.textoBoton,
      accion: async () => {
        await api.put(
          `/admin/reservas/${reserva.id}/estado`,
          null,
          { params: { estado } }
        )

        mostrarMensaje(config.mensajeExito)
        await cargarReservas()
      },
    })
  }

  // Filtrar reservas por búsqueda y estado
  const reservasFiltradas = reservas.filter((r) => {
    const texto = busqueda.trim().toLowerCase()

    const coincideBusqueda =
      String(r.id).includes(texto) ||
      (r.usuario || '').toLowerCase().includes(texto) ||
      (r.producto || '').toLowerCase().includes(texto)

    const coincideEstado =
      filtroEstado === 'todos' || r.estado === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const claseAccion =
    'text-cyan-600 hover:text-cyan-800 hover:underline font-semibold text-sm'

  const clasePago =
    'text-green-600 hover:text-green-800 hover:underline font-semibold text-sm'

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

      {/* Buscador y filtro */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por ID, cliente o producto..."
          aria-label="Buscar reservas"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-cyan-400"
        />

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar reservas por estado"
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-cyan-400"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
          <option value="solicitada">Solicitadas</option>
          <option value="recibida">Recibidas</option>
          <option value="enviada">Enviadas</option>
          <option value="entregada">Entregadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {!cargando && (
        <p className="text-sm text-gray-500 mb-3">
          Mostrando {reservasFiltradas.length} de {reservas.length} reservas
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#4DD9E8' }}>
            <tr>
              {[
                'ID',
                'Usuario',
                'Producto',
                'Precio total',
                'Seña',
                'Saldo restante',
                'Estado',
                'Acciones',
              ].map((columna) => (
                <th
                  key={columna}
                  className="text-left px-4 py-3 text-white whitespace-nowrap"
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center px-4 py-8 text-gray-500"
                >
                  Cargando reservas...
                </td>
              </tr>
            ) : (
              <>
                {reservasFiltradas.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 font-semibold">
                      #{r.id}
                    </td>

                    <td className="px-4 py-3">
                      {r.usuario || `Usuario #${r.user_id}`}
                    </td>

                    <td className="px-4 py-3 min-w-[180px]">
                      {r.producto || `Producto #${r.product_id}`}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-semibold">
                      {formatearPrecio(r.precio_total)}
                    </td>

                    {/* Información de la seña */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{formatearPrecio(r.monto_senia)}</div>

                      <span
                        className={`text-xs font-semibold ${
                          r.senia_pagada
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {r.senia_pagada ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>

                    {/* Información del saldo */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{formatearPrecio(r.saldo_restante)}</div>

                      <span
                        className={`text-xs font-semibold ${
                          r.saldo_pagado
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {r.saldo_pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>

                    {/* Estado de la reserva */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          coloresEstado[r.estado] ||
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </td>

                    {/* Acciones según el estado */}
                    <td className="px-4 py-3 min-w-[170px]">
                      <div className="flex flex-col items-start gap-2">

                        {r.estado === 'pendiente' &&
                          !r.senia_pagada && (
                            <button
                              type="button"
                              className={clasePago}
                              onClick={() => handleConfirmarSenia(r)}
                            >
                              Confirmar seña
                            </button>
                          )}

                        {r.estado === 'pendiente' &&
                          !r.senia_pagada &&
                          !r.saldo_pagado && (
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 hover:underline font-semibold text-sm"
                              onClick={() =>
                                handleCambiarEstadoReserva(r, 'cancelada')
                              }
                            >
                              Cancelar reserva
                            </button>
                          )}

                        {r.estado === 'confirmada' &&
                          r.senia_pagada && (
                            <button
                              type="button"
                              className={claseAccion}
                              onClick={() =>
                                handleCambiarEstadoReserva(r, 'solicitada')
                              }
                            >
                              Marcar como solicitada
                            </button>
                          )}

                        {r.estado === 'solicitada' && (
                          <button
                            type="button"
                            className={claseAccion}
                            onClick={() =>
                              handleCambiarEstadoReserva(r, 'recibida')
                            }
                          >
                            Marcar como recibida
                          </button>
                        )}

                        {r.estado === 'recibida' &&
                          r.senia_pagada &&
                          !r.saldo_pagado && (
                            <button
                              type="button"
                              className={clasePago}
                              onClick={() => handleConfirmarSaldo(r)}
                            >
                              Confirmar saldo
                            </button>
                          )}

                        {r.estado === 'recibida' &&
                          r.senia_pagada &&
                          r.saldo_pagado && (
                            <button
                              type="button"
                              className={claseAccion}
                              onClick={() =>
                                handleCambiarEstadoReserva(r, 'enviada')
                              }
                            >
                              Marcar como enviada
                            </button>
                          )}

                        {r.estado === 'enviada' && (
                          <button
                            type="button"
                            className={claseAccion}
                            onClick={() =>
                              handleCambiarEstadoReserva(r, 'entregada')
                            }
                          >
                            Confirmar entrega
                          </button>
                        )}

                        {r.estado === 'entregada' && (
                          <span className="text-green-600 text-xs font-semibold">
                            Reserva completada
                          </span>
                        )}

                        {r.estado === 'cancelada' && (
                          <span className="text-gray-400 text-xs">
                            Sin acciones disponibles
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {reservasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center px-4 py-8 text-gray-400"
                    >
                      No se encontraron reservas.
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
