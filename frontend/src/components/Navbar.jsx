import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <nav style={{backgroundColor: '#4DD9E8'}} className="px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold cursor-pointer" style={{color: '#FF4DB8'}} onClick={() => navigate('/')}>
        Picusín Mangas
      </h1>
      <div className="flex gap-4 items-center">
        <a href="/" className="text-white font-semibold hover:text-pink-200">Inicio</a>
        <a href="/novedades" className="text-white font-semibold hover:text-pink-200">Novedades</a>
        <a href="/subastas" className="text-white font-semibold hover:text-pink-200">Subastas</a>
        {token ? (
          <button
            onClick={handleLogout}
            className="bg-white px-4 py-1 rounded-full font-semibold hover:opacity-90"
            style={{color: '#FF4DB8'}}
          >
            Cerrar sesión
          </button>
        ) : (
          <a href="/login" className="bg-white px-4 py-1 rounded-full font-semibold hover:opacity-90" style={{color: '#FF4DB8'}}>
            Iniciar sesión
          </a>
        )}
      </div>
    </nav>
  )
}

export default Navbar