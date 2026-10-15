import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

function AdminProductos({ mostrarMensaje, pedirConfirmacion }) {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [archivo, setArchivo] = useState(null)

  // Cargar productos
  useEffect(() => {
    api.get('/admin/productos')
      .then((res) => setProductos(res.data))
      .catch(() =>
        mostrarMensaje('Error al cargar los productos', 'error')
      )
  }, [mostrarMensaje])

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
      setArchivo(null)
      mostrarMensaje(res.data.mensaje)
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.detail || 'Error al cargar el archivo',
        'error'
      )
    }
  }

  // Desactivar producto
  const handleDesactivarProducto = async (id) => {
    await api.delete(`/admin/productos/${id}`)

    setProductos((prev) => prev.filter((p) => p.id !== id))
    mostrarMensaje('Producto desactivado correctamente')
  }

  return (
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
  )
}

export default AdminProductos
