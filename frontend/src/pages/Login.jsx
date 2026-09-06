import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/auth/login?email=${email}&password=${password}`
      )
      localStorage.setItem('token', response.data.access_token)
      navigate('/')
    } catch (error) {
      setError('Email o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6" style={{color: '#FF4DB8'}}>
          Iniciar sesión
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4">
          ¿No tenés cuenta?{' '}
          <a href="/register" style={{color: '#FF4DB8'}} className="font-semibold hover:underline">
            Registrate
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login