import { useState } from 'react'
import Navbar from '../components/Navbar'
import AdminDescuentos from '../components/admin/AdminDescuentos'
import AdminReservas from '../components/admin/AdminReservas'
import AdminSubastas from '../components/admin/AdminSubastas'
import AdminProductos from '../components/admin/AdminProductos'


function Admin() {
  // Estados generales
  const [seccion, setSeccion] = useState('productos')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('exito')

  // Estado para la confirmación personalizada
  const [confirmacion, setConfirmacion] = useState(null)
  const [procesandoConfirmacion, setProcesandoConfirmacion] = useState(false)

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
          <AdminProductos
            mostrarMensaje={mostrarMensaje}
            pedirConfirmacion={pedirConfirmacion}
          />
        )}

        {/* Sección de reservas */}
        {seccion === 'reservas' && (
          <AdminReservas
            mostrarMensaje={mostrarMensaje}
            pedirConfirmacion={pedirConfirmacion}
          />
        )}

        {/* SECCIÓN SUBASTAS */}
        {seccion === 'subastas' && (
          <AdminSubastas
            mostrarMensaje={mostrarMensaje}
            pedirConfirmacion={pedirConfirmacion}
          />
        )}

          {/* Sección de descuentos */}
          {seccion === 'descuentos' && (
            <AdminDescuentos
              mostrarMensaje={mostrarMensaje}
              pedirConfirmacion={pedirConfirmacion}
            />
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

