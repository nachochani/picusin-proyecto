import { useEffect, useRef, useState } from 'react'
import api from '../../api'

function AdminSubastas({ mostrarMensaje, pedirConfirmacion }) {
  const [subastas, setSubastas] = useState([])
  const [productosDisponibles, setProductosDisponibles] = useState([])

  // Crear subasta
  const [mostrarFormularioSubasta, setMostrarFormularioSubasta] = useState(false)
  const [productoSubasta, setProductoSubasta] = useState('')
  const [precioBaseSubasta, setPrecioBaseSubasta] = useState('')
  const [fechaInicioSubasta, setFechaInicioSubasta] = useState('')
  const [fechaFinSubasta, setFechaFinSubasta] = useState('')

  // Extender subasta
  const [subastaAExtender, setSubastaAExtender] = useState(null)
  const [nuevaFechaFin, setNuevaFechaFin] = useState('')
  const formularioExtenderRef = useRef(null)

  const hoy = (() => {
    const fecha = new Date()
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  })()

  // Cargar subastas
  const cargarSubastas = async () => {
    const respuesta = await api.get('/api/subastas')
    setSubastas(respuesta.data)
  }

  useEffect(() => {
    cargarSubastas().catch(() =>
      mostrarMensaje('Error al cargar las subastas', 'error')
    )
  }, [mostrarMensaje])

  // Cargar productos cuando se abre el formulario
  useEffect(() => {
    if (!mostrarFormularioSubasta) return

    api.get('/admin/productos')
      .then((respuesta) => setProductosDisponibles(respuesta.data))
      .catch(() =>
        mostrarMensaje('Error al cargar los productos disponibles', 'error')
      )
  }, [mostrarFormularioSubasta, mostrarMensaje])

  // Validar creación
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

      await cargarSubastas()

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
        { params: { fecha_fin: nuevaFechaFin } }
      )

      await cargarSubastas()

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
    await cargarSubastas()

    if (subastaAExtender?.id === id) {
      setSubastaAExtender(null)
      setNuevaFechaFin('')
    }

    mostrarMensaje('Subasta eliminada correctamente')
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-700">
          Subastas ({subastas.length})
        </h2>

        <button
          type="button"
          onClick={() => setMostrarFormularioSubasta((prev) => !prev)}
          className="px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold transition-colors"
        >
          {mostrarFormularioSubasta ? 'Cerrar formulario' : '+ Crear subasta'}
        </button>
      </div>

      {/* Formulario para extender */}
      {subastaAExtender && (
        <div
          ref={formularioExtenderRef}
          className="mb-6 bg-white rounded-2xl shadow-sm border border-cyan-100 p-6"
        >
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
                nuevaFechaFin <= String(subastaAExtender.fecha_fin).slice(0, 10)
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
            nuevaFechaFin <= String(subastaAExtender.fecha_fin).slice(0, 10) && (
              <p className="text-sm text-red-600 mt-2">
                La nueva fecha debe ser posterior a la fecha actual de finalización.
              </p>
            )}
        </div>
      )}

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

                  if (fechaFinSubasta && e.target.value > fechaFinSubasta) {
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
                          mostrarMensaje('')

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
                <td colSpan="8" className="text-center px-4 py-8 text-gray-400">
                  No hay subastas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminSubastas
