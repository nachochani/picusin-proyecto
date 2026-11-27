import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

function AdminProductos({ mostrarMensaje, pedirConfirmacion }) {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Cargar productos
  useEffect(() => {
    api.get('/admin/productos')
      .then((res) => setProductos(res.data))
      .catch(() =>
        mostrarMensaje('Error al cargar los productos', 'error')
      )
      .finally(() => setCargando(false))
  }, [])

  // Desactivar producto
  const handleDesactivarProducto = async (id) => {
    await api.delete(`/admin/productos/${id}`)

    setProductos((prev) => prev.filter((p) => p.id !== id))
    mostrarMensaje('Producto desactivado correctamente')
  }

  const handlePasarAlCatalogo = async (id) => {
  const res = await api.put(
    `/admin/productos/${id}/pasar-catalogo`
  )

  const productoActualizado = res.data.producto

  setProductos((prev) =>
    prev.map((p) =>
      p.id === id ? productoActualizado : p
    )
  )

  mostrarMensaje(
    'Producto incorporado al catálogo correctamente'
  )
}

  // Obtener categorías sin repetir
  const categorias = [
    ...new Set(
      productos
        .map((p) => p.categoria)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'))

  // Normalizar texto para buscar sin distinguir tildes
  const normalizarTexto = (texto) =>
    String(texto ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  // Aplicar búsqueda y filtros
  const productosFiltrados = productos.filter((p) => {
    const texto = normalizarTexto(busqueda.trim())

    const coincideBusqueda =
      normalizarTexto(p.nombre).includes(texto) ||
      String(p.id).includes(texto)

    const coincideCategoria =
      filtroCategoria === 'todas' ||
      p.categoria === filtroCategoria

    const coincideEstado =
      filtroEstado === 'todos' ||
      p.estado === filtroEstado

    const coincideTipo =
      filtroTipo === 'todos' ||
      (filtroTipo === 'novedades' && p.es_novedad) ||
      (filtroTipo === 'catalogo' && !p.es_novedad)

    return (
      coincideBusqueda &&
      coincideCategoria &&
      coincideEstado &&
      coincideTipo
    )
  })

  // Restablecer filtros
  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroCategoria('todas')
    setFiltroEstado('todos')
    setFiltroTipo('todos')
  }

  const hayFiltros =
    busqueda !== '' ||
    filtroCategoria !== 'todas' ||
    filtroEstado !== 'todos' ||
    filtroTipo !== 'todos'

  const claseFiltro =
    'px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-cyan-400 text-sm'

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-700">
            Productos
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Consultá y gestioná los productos de la tienda.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold transition-colors"
          onClick={() => navigate('/admin/producto/nuevo')}
        >
          + Agregar producto
        </button>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o ID..."
          aria-label="Buscar productos"
          className={`flex-1 ${claseFiltro}`}
        />

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          aria-label="Filtrar por categoría"
          className={claseFiltro}
        >
          <option value="todas">Todas las categorías</option>

          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
          className={claseFiltro}
        >
          <option value="todos">Todos los estados</option>
          <option value="disponible">Disponibles</option>
          <option value="reservado">Reservados</option>
          <option value="vendido">Vendidos</option>
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          aria-label="Filtrar por tipo de producto"
          className={claseFiltro}
        >
          <option value="todos">Todos los tipos</option>
          <option value="novedades">Novedades</option>
          <option value="catalogo">Catálogo</option>
        </select>

        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-sm transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Cantidad de productos encontrados */}
      {!cargando && (
        <p className="text-sm text-gray-500 mb-3">
          Mostrando {productosFiltrados.length} de {productos.length} productos
        </p>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: '#4DD9E8' }}>
            <tr>
              {[
                'ID',
                'Nombre',
                'Categoría',
                'Precio',
                'Estado',
                'Tipo',
                'Sotck',
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
                  Cargando productos...
                </td>
              </tr>
            ) : (
              <>
                {productosFiltrados.map((p, i) => (
                  <tr
                    key={p.id}
                    className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 font-semibold text-sm">
                      #{p.id}
                    </td>

                    <td className="px-4 py-3 min-w-[180px]">
                      {p.nombre}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.categoria || 'Sin categoría'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      ${Number(p.precio).toLocaleString('es-AR')}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          p.es_novedad
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        {p.es_novedad ? 'Novedad' : 'Catálogo'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          p.stock > 0
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="text-cyan-600 hover:text-cyan-800 hover:underline font-semibold"
                          onClick={() =>
                            navigate(`/admin/producto/${p.id}`)
                          }
                        >
                          Editar
                        </button>

                        {p.es_novedad && p.estado === 'disponible' && (
                        <button
                          type="button"
                          className="text-pink-600 hover:text-pink-800 hover:underline font-semibold whitespace-nowrap"
                          onClick={() =>
                            pedirConfirmacion({
                              titulo: 'Pasar producto al catálogo',
                              mensaje: `¿Confirmás que recibiste físicamente "${p.nombre}"? El producto dejará de ser una novedad, tendrá stock disponible y podrá comprarse desde el catálogo.`,
                              textoBoton: 'Pasar al catálogo',
                              accion: () => handlePasarAlCatalogo(p.id),
                            })
                          }
                        >
                          Pasar al catálogo
                        </button>
                      )}

                        <button
                          type="button"
                          className="text-red-400 hover:text-red-600 hover:underline font-semibold"
                          onClick={() =>
                            pedirConfirmacion({
                              titulo: 'Desactivar producto',
                              mensaje: `¿Seguro que querés desactivar "${p.nombre}"? El producto dejará de estar disponible en la tienda.`,
                              textoBoton: 'Sí, desactivar',
                              accion: () =>
                                handleDesactivarProducto(p.id),
                            })
                          }
                        >
                          Desactivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {productosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center px-4 py-8 text-gray-400"
                    >
                      No se encontraron productos.
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

export default AdminProductos
