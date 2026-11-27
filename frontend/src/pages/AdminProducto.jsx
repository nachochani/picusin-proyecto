
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function AdminProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esNuevo = id === 'nuevo'

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagen, setImagen] = useState('')
  const [esNovedad, setEsNovedad] = useState(false)
  const [stock, setStock] = useState(0)
  const [estado, setEstado] = useState('disponible')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(!esNuevo)
  const [guardando, setGuardando] = useState(false)
  const [errorCarga, setErrorCarga] = useState(false)

  useEffect(() => {
    let activo = true

    setMensaje('')
    setError('')
    setErrorCarga(false)

    if (esNuevo) {
      setNombre('')
      setDescripcion('')
      setCategoria('')
      setPrecio('')
      setImagen('')
      setEsNovedad(false)
      setStock(0)
      setEstado('disponible')
      setCargando(false)

      return
    }

    setCargando(true)

    api.get(`/api/productos/${id}`)
      .then((res) => {
        if (!activo) return

        setNombre(res.data.nombre)
        setDescripcion(res.data.descripcion || '')
        setCategoria(res.data.categoria || '')
        setPrecio(res.data.precio)
        setImagen(res.data.imagen || '')
        setEsNovedad(res.data.es_novedad)
        setStock(res.data.stock)
        setEstado(res.data.estado)
      })
      .catch(() => {
        if (!activo) return

        setError('No se pudo cargar el producto')
        setErrorCarga(true)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id, esNuevo])

  const handleGuardar = async () => {
    if (guardando || cargando || errorCarga || mensaje) return

    setError('')
    setMensaje('')

    if (!nombre.trim()) {
      setError('Ingresá el nombre del producto')
      return
    }

    if (!descripcion.trim()) {
      setError('Ingresá una descripción')
      return
    }

    if (
      !precio ||
      !Number.isFinite(Number(precio)) ||
      Number(precio) <= 0
    ) {
      setError('Ingresá un precio válido mayor a cero')
      return
    }

    setGuardando(true)

    try {
      const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria.trim(),
        precio: Number(precio),
        imagen: imagen.trim(),
      }

      if (esNuevo) {
        await api.post('/admin/productos', null, {
          params: {
            ...datos,
            es_novedad: esNovedad,
            es_preventa: esNovedad,
          },
        })

        setMensaje('Producto creado correctamente')
      } else {
        await api.put(`/admin/productos/${id}`, null, {
          params: datos,
        })

        setMensaje('Producto actualizado correctamente')
      }

      setTimeout(() => navigate('/admin'), 1500)
    } catch (error) {
      console.error(
        'Error al guardar el producto:',
        error.response?.data || error.message
      )

      const detalle = error.response?.data?.detail

      setError(
        typeof detalle === 'string'
          ? detalle
          : 'Error al guardar el producto'
      )
    } finally {
      setGuardando(false)
    }
  }

  const claseInput =
    'border border-gray-300 rounded-lg px-4 py-2 w-full outline-none focus:border-cyan-400'

  const formularioDeshabilitado =
    guardando || Boolean(mensaje) || errorCarga

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          disabled={guardando}
          className="mb-6 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          ← Volver al panel
        </button>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: '#FF4DB8' }}
          >
            {esNuevo ? 'Agregar producto' : 'Editar producto'}
          </h1>

          {mensaje && (
            <p className="bg-green-50 text-green-700 rounded-lg p-3 mb-4">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="bg-red-50 text-red-700 rounded-lg p-3 mb-4">
              {error}
            </p>
          )}

          {cargando ? (
            <p className="text-center text-gray-500 py-6">
              Cargando producto...
            </p>
          ) : (
            <fieldset
              disabled={formularioDeshabilitado}
              className="flex flex-col gap-4 disabled:opacity-60"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre
                </label>

                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={100}
                  className={claseInput}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descripción
                </label>

                <textarea
                  placeholder="Descripción del producto"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className={claseInput}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Categoría
                </label>

                <input
                  type="text"
                  placeholder="Categoría (opcional)"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  maxLength={30}
                  className={claseInput}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Precio
                </label>

                <input
                  type="number"
                  placeholder="Precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className={claseInput}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Imagen
                </label>

                <input
                  type="text"
                  placeholder="URL de imagen (opcional)"
                  value={imagen}
                  onChange={(e) => setImagen(e.target.value)}
                  maxLength={500}
                  className={claseInput}
                />
              </div>

              {esNuevo ? (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="font-semibold text-gray-700 mb-3">
                    Tipo de producto
                  </h2>

                  <div className="flex flex-col gap-3">
                    <label
                      className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${
                        !esNovedad
                          ? 'border-cyan-400 bg-cyan-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoProducto"
                        checked={!esNovedad}
                        onChange={() => setEsNovedad(false)}
                        className="mt-1"
                      />

                      <div>
                        <p className="font-semibold text-gray-700">
                          Catálogo
                        </p>

                        <p className="text-sm text-gray-500">
                          Producto disponible físicamente
                          para comprar.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${
                        esNovedad
                          ? 'border-pink-400 bg-pink-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoProducto"
                        checked={esNovedad}
                        onChange={() => setEsNovedad(true)}
                        className="mt-1"
                      />

                      <div>
                        <p className="font-semibold text-gray-700">
                          Novedad
                        </p>

                        <p className="text-sm text-gray-500">
                          Producto disponible para reservar
                          y pedir al proveedor.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="font-semibold text-gray-700 mb-2">
                    Tipo de producto
                  </h2>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      esNovedad
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}
                  >
                    {esNovedad ? 'Novedad' : 'Catálogo'}
                  </span>

                  {esNovedad && estado === 'disponible' && (
                    <p className="text-sm text-gray-500 mt-3">
                      Para registrar la recepción física
                      del producto, utilizá la acción
                      "Pasar al catálogo" desde el panel
                      administrativo.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {esNuevo ? 'Stock inicial' : 'Stock actual'}
                  </span>

                  <span className="font-bold text-gray-700">
                    {esNuevo ? (esNovedad ? 0 : 1) : stock}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {esNuevo ? 'Estado inicial' : 'Estado actual'}
                  </span>

                  <span
                    className={`font-semibold capitalize ${
                      estado === 'disponible'
                        ? 'text-green-600'
                        : estado === 'reservado'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {esNuevo ? 'disponible' : estado}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  El stock y el estado se gestionan
                  automáticamente mediante las operaciones
                  del sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuardar}
                disabled={formularioDeshabilitado}
                className="py-2 rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#4DD9E8' }}
              >
                {guardando
                  ? 'Guardando...'
                  : esNuevo
                    ? 'Crear producto'
                    : 'Guardar cambios'}
              </button>
            </fieldset>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProducto
