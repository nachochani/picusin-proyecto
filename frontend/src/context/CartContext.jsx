
import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext()

const CART_KEY = 'picusin_cart'

function obtenerCarritoGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState(obtenerCarritoGuardado)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(carrito))
  }, [carrito])

  function agregarAlCarrito(producto) {
    setCarrito((actual) => {
      const existe = actual.some((item) => item.id === producto.id)

      // Como el stock habitual es 1, no duplicamos el mismo producto.
      if (existe) return actual

      return [
        ...actual,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          cantidad: 1
        }
      ]
    })
  }

  function quitarDelCarrito(productoId) {
    setCarrito((actual) =>
      actual.filter((item) => item.id !== productoId)
    )
  }

  function vaciarCarrito() {
    setCarrito([])
  }

  const total = carrito.reduce(
    (acumulado, item) => acumulado + item.precio * item.cantidad,
    0
  )

  return (
    <CartContext.Provider
      value={{
        carrito,
        total,
        agregarAlCarrito,
        quitarDelCarrito,
        vaciarCarrito
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
