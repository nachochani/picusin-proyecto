
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

function Home() {
  const [productos, setProductos] = useState([])
  const [subastas, setSubastas] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const categorias = [
    'Figuras',
    'Peluches',
    'TCG',
    'Revistas',
    'Mangas',
    'Artbooks y guías',
    'Música',
    'Gachapones',
    'Otros'
  ]

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/productos')
      .then(response => {
        setProductos(
          response.data.filter(
            producto =>
              producto.es_novedad === true ||
              producto.es_novedad === 1
          )
        )
      })
      .catch(err => {
        console.error('Error al cargar novedades:', err)
        setError(true)
      })
      .finally(() => setCargando(false))

    axios.get('http://127.0.0.1:8000/api/subastas')
      .then(response => {
        setSubastas(
          response.data
            .filter(subasta => subasta.estado === 'activa')
            .slice(0, 4)
        )
      })
      .catch(err => {
        console.error('Error al cargar subastas:', err)
      })
  }, [])

  const productosFiltrados = productos.filter(producto =>
    categoriaSeleccionada === 'Todas' ||
    producto.categoria === categoriaSeleccionada
  )

  const formatearPrecio = precio =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(Number(precio) || 0)

  const diasRestantes = fecha => {
    if (!fecha) return null

    const diferencia = new Date(fecha).getTime() - Date.now()

    if (diferencia <= 0) return 'Finaliza pronto'

    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))

    return dias === 1 ? 'Queda 1 día' : `Quedan ${dias} días`
  }

  const irANovedades = () => {
    document.getElementById('novedades')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 80% 30%, rgba(77,217,232,0.28), transparent 35%), radial-gradient(circle at 70% 90%, rgba(255,77,184,0.24), transparent 38%)'
            }}
          />

          <div className="absolute right-[-50px] top-[-100px] h-80 w-80 rounded-full border border-cyan-300/20" />
          <div className="absolute right-[-10px] top-[-60px] h-64 w-64 rounded-full border border-pink-400/20" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-1 w-9 rounded-full bg-cyan-300" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
                  Picusín Manga
                </span>
              </div>

              <h1 className="max-w-2xl text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Tu próximo
                <span className="block text-pink-400">
                  manga favorito
                </span>
                te espera.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                Mangas, figuras, coleccionables y mucho más.
                Encontrá eso que estabas buscando y sumalo a tu colección.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={irANovedades}
                  className="rounded-full px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
                  style={{ backgroundColor: '#FF4DB8' }}
                >
                  Explorar novedades →
                </button>

                <Link
                  to="/productos"
                  className="rounded-full border-2 border-cyan-300 px-6 py-3 font-bold text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
                >
                  Ver catálogo
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span>✦ Nuevos lanzamientos</span>
                <span>✦ Reservas</span>
                <span>✦ Subastas</span>
              </div>
            </div>

            <div className="relative mx-auto flex min-h-64 w-full max-w-lg items-center justify-center md:min-h-96">
              <div className="absolute h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl md:h-80 md:w-80" />

              <div className="relative w-full rotate-[-3deg] rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
                <div className="absolute -right-3 -top-4 flex h-16 w-16 rotate-12 items-center justify-center rounded-2xl bg-pink-500 text-3xl shadow-lg">
                  ✦
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
                  Tu mundo manga
                </p>

                <div className="my-6 grid grid-cols-2 gap-3">
                  <div className="flex aspect-[3/4] flex-col justify-between rounded-xl border border-white/10 bg-gradient-to-br from-pink-500/80 to-rose-950 p-4">
                    <span className="text-4xl">漫</span>
                    <span className="text-lg font-black uppercase leading-tight">
                      Manga
                      <br />
                      Collection
                    </span>
                  </div>

                  <div className="mt-7 flex aspect-[3/4] flex-col justify-between rounded-xl border border-white/10 bg-gradient-to-br from-cyan-300 to-blue-950 p-4 text-slate-950">
                    <span className="text-4xl">✧</span>
                    <span className="text-lg font-black uppercase leading-tight">
                      Find
                      <br />
                      Your Next
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black tracking-widest text-white">
                      PICUSÍN
                    </p>
                    <p className="text-xs tracking-[0.4em] text-cyan-200">
                      MANGA
                    </p>
                  </div>
                  <span className="rounded-full border border-pink-400/50 px-3 py-1 text-xs font-semibold text-pink-300">
                    Tu próxima lectura
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NOVEDADES */}
        <section
          id="novedades"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-pink-500">
                Recién llegados
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                ✦ Novedades de la semana
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Descubrí los últimos productos de la tienda.
              </p>
            </div>

            <Link
              to="/novedades"
              className="font-bold text-cyan-600 transition hover:text-pink-500"
            >
              Ver todas las novedades →
            </Link>
          </div>

          <div className="mb-7 flex flex-wrap gap-2">
            {['Todas', ...categorias].map(categoria => (
              <button
                key={categoria}
                onClick={() => setCategoriaSeleccionada(categoria)}
                className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor:
                    categoriaSeleccionada === categoria
                      ? '#FF4DB8'
                      : '#FFFFFF',
                  color:
                    categoriaSeleccionada === categoria
                      ? '#FFFFFF'
                      : '#475569',
                  borderColor:
                    categoriaSeleccionada === categoria
                      ? '#FF4DB8'
                      : '#BDEFF4'
                }}
              >
                {categoria}
              </button>
            ))}
          </div>

          {cargando ? (
            <p className="py-12 text-center text-slate-400">
              Cargando novedades...
            </p>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-600">
              No se pudieron cargar los productos. Verificá que el backend esté funcionando.
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
              No hay novedades en esta categoría por el momento.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {productosFiltrados.slice(0, 4).map(producto => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                  />
                ))}
              </div>

              {productosFiltrados.length > 4 && (
                <div className="mt-7 text-center">
                  <Link
                    to="/novedades"
                    className="inline-block rounded-full border-2 border-pink-400 px-6 py-3 font-bold text-pink-500 transition hover:bg-pink-50"
                  >
                    Descubrir más novedades
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* CATEGORÍAS */}
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-7">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-cyan-600">
                Encontrá lo que buscás
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                Explorá por categoría
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { nombre: 'Mangas', simbolo: '漫', color: '#FFE3F3' },
                { nombre: 'Figuras', simbolo: '✧', color: '#DDFBFF' },
                { nombre: 'Peluches', simbolo: '♡', color: '#FFE3F3' },
                { nombre: 'TCG', simbolo: '♧', color: '#DDFBFF' },
                { nombre: 'Otros', simbolo: '✦', color: '#FFE3F3' }
              ].map(categoria => (
                <button
                  key={categoria.nombre}
                  onClick={() => {
                    setCategoriaSeleccionada(categoria.nombre)
                    irANovedades()
                  }}
                  className="group flex min-h-36 flex-col items-center justify-center rounded-2xl border border-transparent p-5 transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
                  style={{ backgroundColor: categoria.color }}
                >
                  <span className="mb-3 text-5xl font-black text-slate-800 transition group-hover:scale-110">
                    {categoria.simbolo}
                  </span>
                  <span className="font-bold text-slate-800">
                    {categoria.nombre}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Explorar →
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/productos"
                className="font-bold text-cyan-700 hover:text-pink-500"
              >
                Ver catálogo completo →
              </Link>
            </div>
          </div>
        </section>

        {/* CÓMO COMPRAR */}
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-pink-50 via-white to-cyan-50 p-6 sm:p-10">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-pink-500">
                Fácil y sencillo
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                ¿Cómo comprar o reservar?
              </h2>
              <p className="mt-2 text-slate-500">
                Encontrá tu próximo favorito en unos pocos pasos.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  numero: '01',
                  titulo: 'Elegí tu producto',
                  texto: 'Explorá el catálogo y consultá los detalles, el precio y la disponibilidad.'
                },
                {
                  numero: '02',
                  titulo: 'Completá la operación',
                  texto: 'Agregá los productos al carrito o iniciá una reserva cuando corresponda.'
                },
                {
                  numero: '03',
                  titulo: 'Coordiná el pago',
                  texto: 'Seguí las indicaciones del negocio para coordinar la transferencia mediante Mercado Pago.'
                }
              ].map(paso => (
                <div key={paso.numero} className="text-center">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white shadow-md"
                    style={{ backgroundColor: '#FF4DB8' }}
                  >
                    {paso.numero}
                  </div>
                  <h3 className="mb-2 font-bold">{paso.titulo}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {paso.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBASTAS */}
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-pink-500">
                Ofertas en juego
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                ⚡ Subastas activas
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Participá y hacé tu puja.
              </p>
            </div>

            <Link
              to="/subastas"
              className="font-bold text-cyan-600 transition hover:text-pink-500"
            >
              Ver todas las subastas →
            </Link>
          </div>

          {subastas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No hay subastas activas para mostrar en este momento.
              <div className="mt-3">
                <Link
                  to="/subastas"
                  className="font-bold text-cyan-700 hover:text-pink-500"
                >
                  Consultar sección de subastas
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {subastas.map(subasta => (
                <article
                  key={subasta.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-48 items-center justify-center bg-slate-50 p-4">
                    {subasta.imagen ? (
                      <img
                        src={subasta.imagen}
                        alt={subasta.producto}
                        className="h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-5xl">📚</span>
                    )}
                  </div>

                  <div className="p-4">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      Subasta activa
                    </span>

                    <h3 className="mt-3 line-clamp-2 min-h-12 font-bold">
                      {subasta.producto || 'Producto en subasta'}
                    </h3>

                    <p className="mt-3 text-sm text-slate-500">
                      Precio actual
                    </p>
                    <p className="text-xl font-black text-pink-500">
                      {formatearPrecio(subasta.precio_actual)}
                    </p>

                    {subasta.fecha_fin && (
                      <p className="mt-2 text-xs text-slate-500">
                        {diasRestantes(subasta.fecha_fin)}
                      </p>
                    )}

                    <Link
                      to={`/subasta/${subasta.id}`}
                      className="mt-4 block rounded-xl px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: '#4DD9E8' }}
                    >
                      Ver subasta →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-black tracking-widest text-pink-400">
              PICUSÍN
            </p>
            <p className="text-xs tracking-[0.4em] text-cyan-300">
              MANGA
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Mangas, coleccionables y mucho más.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
            <Link to="/" className="hover:text-pink-400">Inicio</Link>
            <Link to="/novedades" className="hover:text-pink-400">Novedades</Link>
            <Link to="/productos" className="hover:text-pink-400">Productos</Link>
            <Link to="/subastas" className="hover:text-pink-400">Subastas</Link>
            <Link to="/mis-pedidos" className="hover:text-pink-400">Mis pedidos</Link>
            <Link to="/mis-reservas" className="hover:text-pink-400">Mis reservas</Link>
          </nav>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Picusín Manga. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

export default Home

