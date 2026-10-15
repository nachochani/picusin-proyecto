
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function MisPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const formatoPrecio = (importe) =>
    Number(importe ?? 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

  useEffect(() => {
    async function cargarPedidos() {
      if (!localStorage.getItem('token')) {
        navigate('/login')
        return
      }

      try {
        const respuesta = await api.get('/api/mis-pedidos')
        setPedidos(respuesta.data)
      } catch (error) {
        setMensaje(
          error.response?.data?.detail ||
          'No se pudieron cargar tus pedidos.'
        )
      } finally {
        setCargando(false)
      }
    }

    cargarPedidos()
  }, [navigate])

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#FF4DB8' }}
        >
          Mis pedidos
        </h1>

        {cargando ? (
          <p className="text-gray-600">Cargando tus pedidos...</p>
        ) : mensaje ? (
          <p className="bg-red-100 text-red-700 p-3 rounded-xl">
            {mensaje}
          </p>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              Todavía no realizaste ninguna compra.
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
          <div className="space-y-5">
            {pedidos.map((pedido) => {
              const subtotal = pedido.subtotal ??
                pedido.items.reduce(
                  (acumulado, item) => acumulado + Number(item.subtotal ?? 0),
                  0
                )

              const descuento = Number(pedido.monto_descuento ?? 0)

              return (
                <div
                  key={pedido.id}
                  className="bg-white rounded-2xl shadow-md p-5"
                >
                  <div className="flex flex-wrap justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Pedido #{pedido.id}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {pedido.creado_en
                          ? new Date(pedido.creado_en).toLocaleString('es-AR')
                          : 'Fecha no disponible'}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      {pedido.estado}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pedido.items.map((item, indice) => (
                      <div
                        key={`${pedido.id}-${item.product_id}-${indice}`}
                        className="flex justify-between gap-4 border-t pt-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.nombre}
                          </p>

                          <p className="text-sm text-gray-500">
                            Cantidad: {item.cantidad} · Precio unitario: $
                            {formatoPrecio(item.precio_unitario)}
                          </p>
                        </div>

                        <p className="font-semibold whitespace-nowrap">
                          ${formatoPrecio(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between gap-4 text-gray-600">
                      <span>Subtotal</span>
                      <span>${formatoPrecio(subtotal)}</span>
                    </div>

                    {descuento > 0 && (
                      <>
                        <div className="flex justify-between gap-4 text-green-700">
                          <span>
                            Descuento
                            {pedido.codigo_descuento
                              ? ` (${pedido.codigo_descuento})`
                              : ''}
                          </span>

                          <span>
                            -${formatoPrecio(descuento)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="border-t pt-3 flex justify-between items-center gap-4">
                      <span className="font-semibold">
                        Total del pedido
                      </span>

                      <span
                        className="text-xl font-bold"
                        style={{ color: '#FF4DB8' }}
                      >
                        ${formatoPrecio(pedido.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

export default MisPedidos
