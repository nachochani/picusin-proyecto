import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function AdminProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esNuevo = id === 'nuevo'

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagen, setImagen] = useState('')
  const [esNovedad, setEsNovedad] = useState(false)
  const [esPreventa, setEsPreventa] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')


  useEffect(() => {
    if (!esNuevo) {
      api.get(`/api/productos/${id}`)
        .then(res => {
          setNombre(res.data.nombre)
          setPrecio(res.data.precio)
          setImagen(res.data.imagen || '')
          setEsNovedad(res.data.es_novedad)
          setEsPreventa(res.data.es_preventa)
        })
    }
  }, [id, esNuevo])

  const handleGuardar = async () => {
    try {
      if (esNuevo) {
        await api.post(
          `/admin/productos?nombre=${encodeURIComponent(nombre)}&precio=${precio}&imagen=${encodeURIComponent(imagen)}&es_novedad=${esNovedad}&es_preventa=${esPreventa}`
        )

        setMensaje('Producto creado correctamente')
      } else {
        await api.put(
          `/admin/productos/${id}?nombre=${encodeURIComponent(nombre)}&precio=${precio}&imagen=${encodeURIComponent(imagen)}`
        )

        setMensaje('Producto actualizado correctamente')
      }

      setTimeout(() => navigate('/admin'), 1500)
    } catch (error) {
      console.error('Error al guardar el producto:', error.response?.data || error.message)
      setError('Error al guardar el producto')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <button onClick={() => navigate('/admin')} className="mb-6 text-gray-500 hover:text-gray-700">
          ← Volver al panel
        </button>
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold mb-6" style={{color: '#FF4DB8'}}>
            {esNuevo ? 'Agregar producto' : 'Editar producto'}
          </h1>

          {mensaje && <p className="text-green-500 mb-4">{mensaje}</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <input
              type="number"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <input
              type="text"
              placeholder="URL de imagen (opcional)"
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esNovedad}
                  onChange={(e) => setEsNovedad(e.target.checked)}
                />
                <span className="text-gray-700">Es novedad</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esPreventa}
                  onChange={(e) => setEsPreventa(e.target.checked)}
                />
                <span className="text-gray-700">Es preventa</span>
              </label>
            </div>
            <button
              onClick={handleGuardar}
              className="py-2 rounded-lg text-white font-semibold hover:opacity-90"
              style={{backgroundColor: '#4DD9E8'}}
            >
              {esNuevo ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProducto