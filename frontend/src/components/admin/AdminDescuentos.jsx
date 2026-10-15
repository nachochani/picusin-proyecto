import { useState, useEffect } from 'react'
import api from '../../api'

function AdminDescuentos({ mostrarMensaje, pedirConfirmacion }) {
  const [descuentos, setDescuentos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [descuentoEditando, setDescuentoEditando] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const cargarDescuentos = async () => {
    try {
      const respuesta = await api.get('/admin/descuentos')
      setDescuentos(respuesta.data)
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'Error al cargar los códigos de descuento',
        'error'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDescuentos()
  }, [])

  const handleNuevo = () => {
    setDescuentoEditando(null)
    setCodigo('')
    setPorcentaje('')
    setMostrarFormulario(true)
  }

  const handleEditar = (descuento) => {
    setDescuentoEditando(descuento)
    setCodigo(descuento.codigo)
    setPorcentaje(String(descuento.porcentaje))
    setMostrarFormulario(true)
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setDescuentoEditando(null)
    setCodigo('')
    setPorcentaje('')
  }

  const handleGuardar = async (e) => {
    e.preventDefault()

    const codigoNormalizado = codigo.trim().toUpperCase()
    const porcentajeNumerico = Number(porcentaje)

    if (!codigoNormalizado) {
      mostrarMensaje('Ingresá un código de descuento', 'error')
      return
    }

    if (
      !Number.isFinite(porcentajeNumerico) ||
      porcentajeNumerico <= 0 ||
      porcentajeNumerico > 100
    ) {
      mostrarMensaje(
        'El porcentaje debe ser mayor que 0 y no superar el 100%',
        'error'
      )
      return
    }

    setGuardando(true)

    try {
      const parametros = {
        codigo: codigoNormalizado,
        porcentaje: porcentajeNumerico,
      }

      if (descuentoEditando) {
        await api.put(
          `/admin/descuentos/${descuentoEditando.id}`,
          null,
          { params: parametros }
        )
        mostrarMensaje('Código de descuento actualizado correctamente')
      } else {
        await api.post('/admin/descuentos', null, {
          params: parametros,
        })
        mostrarMensaje('Código de descuento creado correctamente')
      }

      handleCancelar()
      await cargarDescuentos()
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'No se pudo guardar el código de descuento',
        'error'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (descuento) => {
    try {
      await api.put(
        `/admin/descuentos/${descuento.id}/estado`,
        null,
        { params: { activo: !descuento.activo } }
      )

      await cargarDescuentos()

      mostrarMensaje(
        !descuento.activo
          ? 'Código de descuento activado correctamente'
          : 'Código de descuento desactivado correctamente'
      )
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'No se pudo cambiar el estado del código',
        'error'
      )
    }
  }

  const handleEliminar = async (id) => {
    try {
      await api.delete(`/admin/descuentos/${id}`)
      await cargarDescuentos()
      mostrarMensaje('Código de descuento eliminado correctamente')
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail ||
          'No se pudo eliminar el código de descuento',
        'error'
      )
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Códigos de descuento
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Creá y administrá los descuentos de Picusín.
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            onClick={handleNuevo}
            className="bg-[#FF4DB8] hover:bg-pink-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            + Nuevo descuento
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <form
          onSubmit={handleGuardar}
          className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            {descuentoEditando
              ? 'Editar código de descuento'
              : 'Crear código de descuento'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="codigoDescuento"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Código
              </label>
              <input
                id="codigoDescuento"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej.: PICUSIN10"
                maxLength={50}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300 focus:border-[#FF4DB8]"
              />
              <p className="text-xs text-gray-500 mt-1">
                El código se guardará en mayúsculas.
              </p>
            </div>

            <div>
              <label
                htmlFor="porcentajeDescuento"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Porcentaje de descuento
              </label>
              <div className="relative">
                <input
                  id="porcentajeDescuento"
                  type="number"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  placeholder="Ej.: 10"
                  min="0.01"
                  max="100"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-pink-300 focus:border-[#FF4DB8]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="submit"
              disabled={guardando}
              className="bg-[#FF4DB8] hover:bg-pink-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {guardando
                ? 'Guardando...'
                : descuentoEditando
                  ? 'Guardar cambios'
                  : 'Crear código'}
            </button>

            <button
              type="button"
              onClick={handleCancelar}
              disabled={guardando}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total de códigos</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {descuentos.length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-sm text-gray-600">Códigos activos</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {descuentos.filter((d) => d.activo).length}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Códigos inactivos</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {descuentos.filter((d) => !d.activo).length}
          </p>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500 py-8">
          Cargando descuentos...
        </p>
      ) : descuentos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-3">🏷️</p>
          <h3 className="text-lg font-semibold text-gray-700">
            Todavía no hay descuentos
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Creá tu primer código para comenzar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#4DD9E8] text-gray-800">
              <tr>
                <th className="px-4 py-4 font-bold">Código</th>
                <th className="px-4 py-4 font-bold">Descuento</th>
                <th className="px-4 py-4 font-bold">Estado</th>
                <th className="px-4 py-4 font-bold">Creado</th>
                <th className="px-4 py-4 font-bold text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {descuentos.map((descuento) => (
                <tr
                  key={descuento.id}
                  className="hover:bg-pink-50/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="inline-block bg-pink-50 text-[#D62991] border border-pink-100 px-3 py-1.5 rounded-lg font-bold tracking-wide">
                      {descuento.codigo}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-lg font-bold text-gray-800">
                      {Number(descuento.porcentaje)}%
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                        descuento.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          descuento.activo ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {descuento.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                    {descuento.creado_en
                      ? new Date(descuento.creado_en).toLocaleDateString('es-AR')
                      : '—'}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditar(descuento)}
                        className="px-3 py-2 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-semibold transition-colors"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleCambiarEstado(descuento)}
                        className={`px-3 py-2 rounded-lg border font-semibold transition-colors ${
                          descuento.activo
                            ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {descuento.activo ? 'Desactivar' : 'Activar'}
                      </button>

                      <button
                        onClick={() =>
                          pedirConfirmacion({
                            titulo: 'Eliminar código de descuento',
                            mensaje: `¿Seguro que querés eliminar el código "${descuento.codigo}"? Esta acción no se puede deshacer.`,
                            textoBoton: 'Eliminar código',
                            accion: () => handleEliminar(descuento.id),
                          })
                        }
                        className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminDescuentos
