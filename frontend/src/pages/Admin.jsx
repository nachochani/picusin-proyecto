import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

function Admin() {
  const navigate = useNavigate()
  const [seccion, setSeccion] = useState('productos')
  const [productos, setProductos] = useState([])

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/admin/productos')
      .then(res => setProductos(res.data))
      .catch(() => console.error('Error al cargar productos'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{color: '#FF4DB8'}}>
          Panel de Administración
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['productos', 'reservas', 'descuentos', 'subastas'].map(tab => (
            <button
              key={tab}
              onClick={() => setSeccion(tab)}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Productos</h2>
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
                      <td className="px-4 py-3">${p.precio}</td>
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
                      <td className="px-4 py-3">
                        <button
                          className="text-cyan-500 hover:underline font-semibold"
                          onClick={() => navigate(`/admin/producto/${p.id}`)}
                        >
                          Editar
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
            <p className="text-gray-400">Próximamente...</p>
          </div>
        )}

        {/* Sección descuentos */}
        {seccion === 'descuentos' && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Códigos de descuento</h2>
            <p className="text-gray-400">Próximamente...</p>
          </div>
        )}

        {/* Sección subastas */}
        {seccion === 'subastas' && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Subastas</h2>
            <p className="text-gray-400">Próximamente...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin