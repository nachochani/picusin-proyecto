import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function Admin() {
  const navigate = useNavigate()
  const [seccion, setSeccion] = useState('productos')
  const [productos, setProductos] = useState([])
  const [reservas, setReservas] = useState([])
  const [subastas, setSubastas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [archivo, setArchivo] = useState(null)


  useEffect(() => {
    if (seccion === 'productos') {
      api.get('/admin/productos')
        .then(res => setProductos(res.data))
        .catch(() => setMensaje('Error al cargar los productos'))
    }

    if (seccion === 'reservas') {
      api.get('/admin/reservas')
        .then(res => setReservas(res.data))
        .catch(() => setMensaje('Error al cargar las reservas'))
    }

    if (seccion === 'subastas') {
     api.get('/api/subastas')
      .then(res => setSubastas(res.data))
      .catch(() => setMensaje('Error al cargar las subastas'))
    }
  }, [seccion])

  const handleCargarExcel = async () => {
    if (!archivo) return

    const formData = new FormData()
    formData.append('archivo', archivo)

    try {
      const res = await api.post('/admin/cargar-excel', formData)
      setMensaje(res.data.mensaje)

      const productosRes = await api.get('/admin/productos')
      setProductos(productosRes.data)
    } catch (_) {
      setMensaje('Error al cargar el archivo')
    }
  }

  const handleCambiarEstadoReserva = async (id, estado) => {
    try {
      await api.put(`/admin/reservas/${id}/estado?estado=${estado}`)

      const reservasRes = await api.get('/admin/reservas')
      setReservas(reservasRes.data)
    } catch (_) {
      setMensaje('Error al actualizar la reserva')
    }
  }

  const handleDesactivarProducto = async (id) => {
    try {
      await api.delete(`/admin/productos/${id}`)
      setProductos(prev => prev.filter(p => p.id !== id))
    } catch (_) {
      setMensaje('Error al desactivar el producto')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{color: '#FF4DB8'}}>
          Panel de Administración
        </h1>

        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['productos', 'reservas', 'subastas', 'descuentos'].map(tab => (
            <button
              key={tab}
              onClick={() => { setSeccion(tab); setMensaje('') }}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                seccion === tab ? 'text-white' : 'bg-white text-gray-500 border'
              }`}
              style={seccion === tab ? {backgroundColor: '#4DD9E8'} : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sección productos */}
        {seccion === 'productos' && (
          <div>
            {/* Carga masiva */}
            <div className="bg-white rounded-2xl shadow p-4 mb-6">
              <h2 className="text-lg font-bold text-gray-700 mb-3">Carga masiva por Excel</h2>
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleCargarExcel}
                  className="px-4 py-2 rounded-lg text-white font-semibold"
                  style={{backgroundColor: '#4DD9E8'}}
                >
                  Cargar Excel
                </button>
              </div>
            </div>

            {/* Tabla productos */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Productos ({productos.length})</h2>
              <button
                className="px-4 py-2 rounded-lg text-white font-semibold"
                style={{backgroundColor: '#FF4DB8'}}
                onClick={() => navigate('/admin/producto/nuevo')}
              >
                + Agregar producto
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full">
                <thead style={{backgroundColor: '#4DD9E8'}}>
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
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3">{p.nombre}</td>
                      <td className="px-4 py-3">${p.precio.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          p.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                          p.estado === 'reservado' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">{p.es_novedad ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          className="text-cyan-500 hover:underline font-semibold"
                          onClick={() => navigate(`/admin/producto/${p.id}`)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-red-400 hover:underline font-semibold"
                          onClick={() => handleDesactivarProducto(p.id)}
                        >
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección reservas */}
        {seccion === 'reservas' && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Reservas</h2>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full">
                <thead style={{backgroundColor: '#4DD9E8'}}>
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
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.user_id}</td>
                      <td className="px-4 py-3">{r.product_id}</td>
                      <td className="px-4 py-3">${r.monto_senia?.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.estado === 'confirmada' ? 'bg-green-100 text-green-700' :
                          r.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          className="text-green-500 hover:underline font-semibold text-sm"
                          onClick={() => handleCambiarEstadoReserva(r.id, 'confirmada')}
                        >
                          Confirmar
                        </button>
                        <button
                          className="text-red-400 hover:underline font-semibold text-sm"
                          onClick={() => handleCambiarEstadoReserva(r.id, 'cancelada')}
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Sección subastas */}
        {seccion === 'subastas' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">
                Subastas ({subastas.length})
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-x-auto">
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.estado === 'activa'
                            ? 'bg-green-100 text-green-700'
                            : s.estado === 'finalizada'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {s.estado}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {subastas.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center px-4 py-8 text-gray-400">
                        No hay subastas para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Admin