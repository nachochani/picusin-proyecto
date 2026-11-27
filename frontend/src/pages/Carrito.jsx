
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import ModalPago from '../components/ModalPago'
import { useCart } from '../context/CartContext'

function Carrito() {
  const navigate = useNavigate()

  const {
    carrito,
    total,
    quitarDelCarrito,
    vaciarCarrito
  } = useCart()

  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')
  const [codigoDescuento, setCodigoDescuento] = useState('')
  const [descuentoAplicado, setDescuentoAplicado] = useState(null)
  const [validandoCodigo, setValidandoCodigo] = useState(false)

  // Estados del modal de pago
  const [modalPago, setModalPago] = useState(null)
  const [errorPago, setErrorPago] = useState('')
  const pagoEnCurso = useRef(false)

  const formatearPrecio = (precio) =>
    Number(precio || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    })

  const importeDescuento = descuentoAplicado
    ? Math.round(
        total * descuentoAplicado.porcentaje
      ) / 100
    : 0

  const totalConDescuento = Math.round(
    (total - importeDescuento) * 100
  ) / 100

  // Abrir modal sin generar todavía el pedido
  function abrirModalPago() {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    if (
      carrito.length === 0 ||
      procesando ||
      validandoCodigo
    ) return

    setMensaje('')
    setTipoMensaje('')
    setErrorPago('')

    setModalPago({
      monto: totalConDescuento,
      items: carrito.map((item) => ({
        product_id: item.id,
        cantidad: item.cantidad
      })),
      codigoDescuento: descuentoAplicado?.codigo || null
    })
  }

  // Cerrar modal
  function cerrarModalPago() {
    if (pagoEnCurso.current) return

    setModalPago(null)
    setErrorPago('')
  }

  // Confirmar el pago y generar el pedido
  async function confirmarCompra() {
    if (!modalPago || pagoEnCurso.current) return

    pagoEnCurso.current = true
    setProcesando(true)
    setErrorPago('')

    try {
      await api.post('/api/pedidos/demo', {
        items: modalPago.items,
        codigo_descuento: modalPago.codigoDescuento,
        importe_esperado: modalPago.monto
      })

      setModalPago(null)
      vaciarCarrito()

      setDescuentoAplicado(null)
      setCodigoDescuento('')

      setMensaje(
        '¡Compra realizada con éxito! Redirigiendo a Mis pedidos...'
      )
      setTipoMensaje('exito')

      setTimeout(() => {
        navigate('/mis-pedidos')
      }, 1500)

    } catch (error) {
      setErrorPago(
        error.response?.data?.detail ||
        'No se pudo completar la compra. Revisá la disponibilidad de los productos.'
      )

    } finally {
      pagoEnCurso.current = false
      setProcesando(false)
    }
  }

  // Aplicar código de descuento
  async function aplicarDescuento() {
    if (
      !codigoDescuento.trim() ||
      validandoCodigo ||
      procesando ||
      modalPago
    ) return

    setValidandoCodigo(true)
    setMensaje('')
    setTipoMensaje('')

    try {
      const respuesta = await api.get(
        `/api/validar/${encodeURIComponent(codigoDescuento.trim())}`
      )

      setDescuentoAplicado(respuesta.data)
      setCodigoDescuento(respuesta.data.codigo)
      setMensaje(respuesta.data.mensaje)
      setTipoMensaje('exito')

    } catch (error) {
      setDescuentoAplicado(null)

      setMensaje(
        error.response?.data?.detail ||
        'No se pudo validar el código de descuento.'
      )

      setTipoMensaje('error')

    } finally {
      setValidandoCodigo(false)
    }
  }

  // Quitar código de descuento
  function quitarDescuento() {
    setDescuentoAplicado(null)
    setCodigoDescuento('')
    setMensaje('')
    setTipoMensaje('')
  }

  const carritoBloqueado = procesando || !!modalPago

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Mi carrito
        </h1>

        {mensaje && (
          <p
            className={`mb-4 p-3 rounded-xl ${
              tipoMensaje === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {mensaje}
          </p>
        )}

        {carrito.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no agregaste productos al carrito.
            </p>

            <button
              onClick={() => navigate('/productos')}
              className="px-5 py-2 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#4DD9E8' }}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow p-4 flex items-center gap-4"
                >
                  <img
                    src={
                      item.imagen ||
                      'https://via.placeholder.com/100x100?text=Sin+imagen'
                    }
                    alt={item.nombre}
                    className="w-20 h-20 object-contain"
                  />

                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">
                      {item.nombre}
                    </h2>

                    <p className="text-gray-500">
                      Cantidad: {item.cantidad}
                    </p>

                    <p
                      style={{ color: '#FF4DB8' }}
                      className="font-bold"
                    >
                      {formatearPrecio(
                        item.precio * item.cantidad
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => quitarDelCarrito(item.id)}
                    disabled={carritoBloqueado}
                    className="px-3 py-2 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow p-6 mt-6">

              {/* Código de descuento */}
              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">
                  ¿Tenés un código de descuento?
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={codigoDescuento}
                    onChange={(e) =>
                      setCodigoDescuento(e.target.value)
                    }
                    disabled={
                      !!descuentoAplicado ||
                      validandoCodigo ||
                      carritoBloqueado
                    }
                    placeholder="Ingresá tu código"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 uppercase focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />

                  {descuentoAplicado ? (
                    <button
                      type="button"
                      onClick={quitarDescuento}
                      disabled={carritoBloqueado}
                      className="px-5 py-3 rounded-full font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                    >
                      Quitar código
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={aplicarDescuento}
                      disabled={
                        !codigoDescuento.trim() ||
                        validandoCodigo ||
                        carritoBloqueado
                      }
                      className="px-5 py-3 rounded-full text-white font-semibold disabled:opacity-50"
                      style={{ backgroundColor: '#4DD9E8' }}
                    >
                      {validandoCodigo
                        ? 'Validando...'
                        : 'Aplicar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center mb-3 text-gray-600">
                <span>Subtotal</span>

                <span className="font-semibold">
                  {formatearPrecio(total)}
                </span>
              </div>

              {/* Descuento aplicado */}
              {descuentoAplicado && (
                <div className="flex justify-between items-center mb-3 text-green-700">
                  <span>
                    Descuento ({descuentoAplicado.codigo} -{' '}
                    {descuentoAplicado.porcentaje}%)
                  </span>

                  <span className="font-semibold">
                    -{formatearPrecio(importeDescuento)}
                  </span>
                </div>
              )}

              {/* Total de la compra */}
              <div className="flex justify-between items-center mb-5 pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold">
                  Total
                </span>

                <span
                  className="text-2xl font-bold"
                  style={{ color: '#FF4DB8' }}
                >
                  {formatearPrecio(totalConDescuento)}
                </span>
              </div>

              {/* Abrir modal de pago */}
              <button
                type="button"
                onClick={abrirModalPago}
                disabled={
                  carritoBloqueado || validandoCodigo
                }
                className="w-full px-5 py-3 rounded-full text-white font-bold disabled:opacity-50"
                style={{ backgroundColor: '#FF4DB8' }}
              >
                Finalizar compra
              </button>

              <button
                type="button"
                onClick={vaciarCarrito}
                disabled={carritoBloqueado}
                className="w-full mt-3 px-5 py-2 rounded-full font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal reutilizable de pago */}
      {modalPago && (
        <ModalPago
          titulo="Pagar compra"
          descripcion={`Compra de ${
            modalPago.items.reduce(
              (cantidad, item) => cantidad + item.cantidad,
              0
            )
          } producto(s)`}
          monto={modalPago.monto}
          procesando={procesando}
          error={errorPago}
          onConfirmar={confirmarCompra}
          onCancelar={cerrarModalPago}
        />
      )}
    </>
  )
}

export default Carrito

