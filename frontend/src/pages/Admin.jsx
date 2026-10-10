import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'


function Admin() {
  const navigate = useNavigate()

  // Estados generales
  const [seccion, setSeccion] = useState('productos')
  const [productos, setProductos] = useState([])
  const [reservas, setReservas] = useState([])
  const [subastas, setSubastas] = useState([])
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('exito')
  const [archivo, setArchivo] = useState(null)

  // Estados para crear subastas
  const [mostrarFormularioSubasta, setMostrarFormularioSubasta] = useState(false)
  const [productoSubasta, setProductoSubasta] = useState('')
  const [precioBaseSubasta, setPrecioBaseSubasta] = useState('')
  const [fechaInicioSubasta, setFechaInicioSubasta] = useState('')
  const [fechaFinSubasta, setFechaFinSubasta] = useState('')

  // Estados para extender subastas
  const [subastaAExtender, setSubastaAExtender] = useState(null)
  const [nuevaFechaFin, setNuevaFechaFin] = useState('')
  const formularioExtenderRef = useRef(null)

  // Estado para la confirmación personalizada
  const [confirmacion, setConfirmacion] = useState(null)
  const [procesandoConfirmacion, setProcesandoConfirmacion] = useState(false)

  const hoy = (() => {
    const fecha = new Date()
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  })()

  // Mensajes
  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje(texto)
    setTipoMensaje(tipo)
  }

  // Abrir confirmación reutilizable
  const pedirConfirmacion = ({
    titulo,
    mensaje,
    textoBoton = 'Confirmar',
    accion,
  }) => {
    setConfirmacion({
      titulo,
      mensaje,
      textoBoton,
      accion,
    })
  }

  // Ejecutar la acción después de confirmar
  const handleConfirmarAccion = async () => {
    if (!confirmacion || procesandoConfirmacion) return

    setProcesandoConfirmacion(true)

    try {
      await confirmacion.accion()
      setConfirmacion(null)
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'No se pudo completar la operación. Intentá nuevamente.',
        'error'
      )
      setConfirmacion(null)
    } finally {
      setProcesandoConfirmacion(false)
    }
  }

  // Validaciones para crear una subasta
  const validarSubasta = () => {
    if (!productoSubasta) {
      mostrarMensaje('Seleccioná un producto para la subasta', 'error')
      return false
    }

    if (!precioBaseSubasta || Number(precioBaseSubasta) <= 0) {
      mostrarMensaje('El precio base debe ser mayor que cero', 'error')
      return false
    }

    if (!fechaInicioSubasta || !fechaFinSubasta) {
      mostrarMensaje('Completá las fechas de inicio y finalización', 'error')
      return false
    }

    if (fechaInicioSubasta < hoy) {
      mostrarMensaje('La fecha de inicio no puede ser anterior a hoy', 'error')
      return false
    }

    if (fechaFinSubasta < hoy) {
      mostrarMensaje('La fecha de finalización no puede ser anterior a hoy', 'error')
      return false
    }

    if (fechaFinSubasta < fechaInicioSubasta) {
      mostrarMensaje(
        'La fecha de finalización debe ser igual o posterior al inicio',
        'error'
      )
      return false
    }

    setMensaje('')
    return true
  }

  // Crear subasta
  const handleCrearSubasta = async () => {
    if (!validarSubasta()) return

    try {
      await api.post('/api/subastas', null, {
        params: {
          product_id: Number(productoSubasta),
          precio_base: Number(precioBaseSubasta),
          fecha_inicio: fechaInicioSubasta,
          fecha_fin: fechaFinSubasta,
        },
      })

      const respuesta = await api.get('/api/subastas')
      setSubastas(respuesta.data)

      mostrarMensaje('Subasta creada correctamente')
      setMostrarFormularioSubasta(false)
      setProductoSubasta('')
      setPrecioBaseSubasta('')
      setFechaInicioSubasta('')
      setFechaFinSubasta('')
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail || 'Error al crear la subasta',
        'error'
      )
    }
  }

  // Extender subasta
  const handleExtenderSubasta = async () => {
    if (!subastaAExtender || !nuevaFechaFin) {
      mostrarMensaje('Seleccioná una nueva fecha de finalización', 'error')
      return
    }

    const fechaActual = String(subastaAExtender.fecha_fin).slice(0, 10)

    if (nuevaFechaFin <= fechaActual) {
      mostrarMensaje(
        'La nueva fecha debe ser posterior a la fecha de finalización actual',
        'error'
      )
      return
    }

    try {
      await api.put(
        `/api/subastas/${subastaAExtender.id}/extender`,
        null,
        {
          params: {
            fecha_fin: nuevaFechaFin,
          },
        }
      )

      const respuesta = await api.get('/api/subastas')
      setSubastas(respuesta.data)

      mostrarMensaje('Subasta extendida correctamente')
      setSubastaAExtender(null)
      setNuevaFechaFin('')

    } catch (error) {
      console.error('Error al extender la subasta:', error)

      mostrarMensaje(
        error.response?.data?.detail
          ? `Error: ${error.response.data.detail}`
          : error.response
            ? `Error HTTP ${error.response.status}`
            : 'No se pudo conectar con el backend',
        'error'
      )
    }
  }

  // Eliminar subasta y sus pujas
  const handleEliminarSubasta = async (id) => {
    await api.delete(`/api/subastas/${id}`)

    const respuesta = await api.get('/api/subastas')
    setSubastas(respuesta.data)

    if (subastaAExtender?.id === id) {
      setSubastaAExtender(null)
      setNuevaFechaFin('')
    }

    mostrarMensaje('Subasta eliminada correctamente')
  }

  // Cargar Excel
  const handleCargarExcel = async () => {
    if (!archivo) {
      mostrarMensaje('Seleccioná un archivo Excel', 'error')
      return
    }

    const formData = new FormData()
    formData.append('archivo', archivo)

    try {
      const res = await api.post('/admin/cargar-excel', formData)
      const productosRes = await api.get('/admin/productos')

      setProductos(productosRes.data)
      mostrarMensaje(res.data.mensaje)
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail || 'Error al cargar el archivo',
        'error'
      )
    }
  }

  // Cambiar estado de reserva
  const handleCambiarEstadoReserva = async (id, estado) => {
    await api.put(`/admin/reservas/${id}/estado?estado=${estado}`)

    const reservasRes = await api.get('/admin/reservas')
    setReservas(reservasRes.data)

    mostrarMensaje(
      estado === 'confirmada'
        ? 'Reserva confirmada correctamente'
        : 'Reserva cancelada correctamente'
    )
  }

  // Desactivar producto
  const handleDesactivarProducto = async (id) => {
    await api.delete(`/admin/productos/${id}`)

    setProductos((prev) => prev.filter((p) => p.id !== id))
    mostrarMensaje('Producto desactivado correctamente')
  }

  // Cargar datos de cada sección
  useEffect(() => {
    if (seccion === 'productos') {
      api.get('/admin/productos')
        .then((res) => setProductos(res.data))
        .catch(() => mostrarMensaje('Error al cargar los productos', 'error'))
    }

    if (seccion === 'reservas') {
      api.get('/admin/reservas')
        .then((res) => setReservas(res.data))
        .catch(() => mostrarMensaje('Error al cargar las reservas', 'error'))
    }

    if (seccion === 'subastas') {
      api.get('/api/subastas')
        .then((res) => setSubastas(res.data))
        .catch(() => mostrarMensaje('Error al cargar las subastas', 'error'))
    }

    if (seccion === 'subastas' && mostrarFormularioSubasta) {
      api.get('/admin/productos')
        .then((res) => setProductosDisponibles(res.data))
        .catch(() =>
          mostrarMensaje('Error al cargar los productos disponibles', 'error')
        )
    }
  }, [seccion, mostrarFormularioSubasta])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Panel de Administración
        </h1>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              tipoMensaje === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Pestañas */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['productos', 'reservas', 'subastas', 'descuentos'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setSeccion(tab)
                setMensaje('')
              }}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                seccion === tab
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
              style={
                seccion === tab
                  ? { backgroundColor: '#4DD9E8' }
                  : {}
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SECCIÓN PRODUCTOS */}
        {seccion === 'productos' && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <h2 className="text-lg font-bold text-gray-700 mb-3">
                Carga masiva por Excel
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="border border-gray-300 rounded-lg px-3 py-2 max-w-full"
                />

                <button
                  type="button"
                  onClick={handleCargarExcel}
                  className="px-4 py-2 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold transition-colors"
                >
                  Cargar Excel
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-700">
                Productos ({productos.length})
              </h2>

              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold transition-colors"
                onClick={() => navigate('/admin/producto/nuevo')}
              >
                + Agregar producto
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#4DD9E8' }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-white">Nombre</th>
                    <th className="text-left px-4 py-3 text-white">Precio</th>
                    <th className="text-left px-4 py-3 text-white">Estado</th>
                    <th className="text-left px-4 py-3 text-white">Novedad</th>
                    <th className="text-left px-4 py-3 text-white">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((p, i) => (
                    <tr
                      key={p.id}
                      className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3">{p.nombre}</td>
                      <td className="px-4 py-3">
                        ${Number(p.precio).toLocaleString('es-AR')}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            p.estado === 'disponible'
                              ? 'bg-green-100 text-green-700'
                              : p.estado === 'reservado'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {p.es_novedad ? '✅' : '❌'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="text-cyan-600 hover:text-cyan-800 hover:underline font-semibold"
                            onClick={() => navigate(`/admin/producto/${p.id}`)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="text-red-400 hover:text-red-600 hover:underline font-semibold"
                            onClick={() =>
                              pedirConfirmacion({
                                titulo: 'Desactivar producto',
                                mensaje: `¿Seguro que querés desactivar "${p.nombre}"? El producto dejará de estar disponible en la tienda.`,
                                textoBoton: 'Sí, desactivar',
                                accion: () => handleDesactivarProducto(p.id),
                              })
                            }
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {productos.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center px-4 py-8 text-gray-400"
                      >
                        No hay productos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECCIÓN RESERVAS */}
        {seccion === 'reservas' && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Reservas
            </h2>

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
                                    .catch((error) =>
                                      mostrarMensaje(
                                        error.response?.data?.detail ||
                                          'Error al confirmar la reserva',
                                        'error'
                                      )
                                    )
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
                                    handleCambiarEstadoReserva(r.id, 'cancelada'),
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECCIÓN SUBASTAS */}
        {seccion === 'subastas' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-700">
                Subastas ({subastas.length})
              </h2>

              {subastaAExtender && (
              <div 
                ref={formularioExtenderRef}
                className="mt-6 bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Extender subasta #{subastaAExtender.id}
                </h3>

                <p className="text-sm text-gray-600 mb-2">
                  Producto: {subastaAExtender.producto}
                </p>

                <p className="text-sm text-gray-600 mb-4">
                  Fecha de finalización actual:{' '}
                  {String(subastaAExtender.fecha_fin).slice(0, 10)}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nueva fecha de finalización
                    </label>

                    <input
                      type="date"
                      min={String(subastaAExtender.fecha_fin).slice(0, 10)}
                      value={nuevaFechaFin}
                      onChange={(e) => setNuevaFechaFin(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExtenderSubasta}
                    disabled={
                      !nuevaFechaFin ||
                      nuevaFechaFin <=
                        String(subastaAExtender.fecha_fin).slice(0, 10)
                    }
                    className="px-4 py-2 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    Guardar fecha
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubastaAExtender(null)
                      setNuevaFechaFin('')
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

                {nuevaFechaFin &&
                  nuevaFechaFin <=
                    String(subastaAExtender.fecha_fin).slice(0, 10) && (
                    <p className="text-sm text-red-600 mt-2">
                      La nueva fecha debe ser posterior a la fecha actual de
                      finalización.
                    </p>
                  )}
              </div>
            )}

              <button
                type="button"
                onClick={() => setMostrarFormularioSubasta((prev) => !prev)}
                className="px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold transition-colors"
              >
                {mostrarFormularioSubasta ? 'Cerrar formulario' : '+ Crear subasta'}
              </button>
            </div>

            {/* Formulario de creación */}
            {mostrarFormularioSubasta && (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-700 mb-4">
                  Crear nueva subasta
                </h3>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Producto
                    </label>

                    <select
                      value={productoSubasta}
                      onChange={(e) => setProductoSubasta(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Seleccioná un producto</option>

                      {productosDisponibles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Precio base ($)
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={precioBaseSubasta}
                      onChange={(e) => setPrecioBaseSubasta(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Ej. 50000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Fecha de inicio
                    </label>

                    <input
                      type="date"
                      min={hoy}
                      value={fechaInicioSubasta}
                      onChange={(e) => {
                        setFechaInicioSubasta(e.target.value)

                        if (
                          fechaFinSubasta &&
                          e.target.value > fechaFinSubasta
                        ) {
                          setFechaFinSubasta('')
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Fecha de finalización
                    </label>

                    <input
                      type="date"
                      min={fechaInicioSubasta || hoy}
                      value={fechaFinSubasta}
                      onChange={(e) => setFechaFinSubasta(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCrearSubasta}
                      className="px-5 py-2 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold transition-colors"
                    >
                      Crear subasta
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabla de subastas */}
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#4DD9E8' }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-white">ID</th>
                    <th className="text-left px-4 py-3 text-white">Producto</th>
                    <th className="text-left px-4 py-3 text-white">Precio base</th>
                    <th className="text-left px-4 py-3 text-white">Precio actual</th>
                    <th className="text-left px-4 py-3 text-white">Inicio</th>
                    <th className="text-left px-4 py-3 text-white">Fin</th>
                    <th className="text-left px-4 py-3 text-white">Estado</th>
                    <th className="text-left px-4 py-3 text-white">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {subastas.map((s, i) => (
                    <tr
                      key={s.id}
                      className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3">{s.id}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.imagen && (
                            <img
                              src={s.imagen}
                              alt={s.producto}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <span>{s.producto}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        ${Number(s.precio_base).toLocaleString('es-AR')}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        ${Number(s.precio_actual).toLocaleString('es-AR')}
                      </td>

                      <td className="px-4 py-3">{s.fecha_inicio}</td>
                      <td className="px-4 py-3">{s.fecha_fin}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            s.estado === 'activa'
                              ? 'bg-green-100 text-green-700'
                              : s.estado === 'finalizada'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {s.estado}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          {s.estado === 'activa' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubastaAExtender(s)
                                setNuevaFechaFin('')
                                setMensaje('')

                                setTimeout(() => {
                                  formularioExtenderRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  })
                                }, 100)
                              }}
                              className="px-3 py-2 rounded-lg text-sm font-semibold bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors"
                            >
                              Extender
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              pedirConfirmacion({
                                titulo: 'Eliminar subasta',
                                mensaje: `¿Seguro que querés eliminar la subasta #${s.id} de "${s.producto}"? También se eliminarán todas las pujas asociadas. Esta acción no se puede deshacer.`,
                                textoBoton: 'Sí, eliminar subasta',
                                accion: () => handleEliminarSubasta(s.id),
                              })
                            }
                            className="px-3 py-2 rounded-lg text-sm font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {subastas.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center px-4 py-8 text-gray-400"
                      >
                        No hay subastas para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario para extender subasta */}
            
          </div>
        )}

        {/* La pestaña descuentos queda reservada para su implementación */}
        {seccion === 'descuentos' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Descuentos
            </h2>
            <p className="text-gray-500">
              La administración de descuentos todavía no está disponible en
              esta sección.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN REUTILIZABLE */}
      {confirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-pink-100 text-pink-600 text-xl font-bold">
                !
              </div>

              <div>
                <h2
                  id="titulo-confirmacion"
                  className="text-xl font-bold text-gray-800 mb-2"
                >
                  {confirmacion.titulo}
                </h2>

                <p className="text-sm leading-relaxed text-gray-600">
                  {confirmacion.mensaje}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                disabled={procesandoConfirmacion}
                onClick={() => setConfirmacion(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 font-semibold transition-colors"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={procesandoConfirmacion}
                onClick={handleConfirmarAccion}
                className="px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 disabled:opacity-50 font-semibold transition-colors"
              >
                {procesandoConfirmacion
                  ? 'Procesando...'
                  : confirmacion.textoBoton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin

