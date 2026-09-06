import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Register() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post(
        `http://127.0.0.1:8000/auth/register?nombre=${nombre}&apellido=${apellido}&email=${email}&password=${password}`
      )
      setExito('¡Cuenta creada correctamente! Redirigiendo...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (_) {
      setError('Error al registrarse, el email ya puede estar en uso')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6" style={{color: '#FF4DB8'}}>
          Crear cuenta
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {exito && <p className="text-green-500 text-center mb-4">{exito}</p>}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="text"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="py-2 rounded-lg text-white font-semibold hover:opacity-90"
            style={{backgroundColor: '#4DD9E8'}}
          >
            Registrarse
          </button>
        </form>
        <p className="text-center text-gray-500 mt-4">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" style={{color: '#FF4DB8'}} className="font-semibold hover:underline">
            Iniciá sesión
          </a>
        </p>
      </div>
    </div>
  )
}

export default Register