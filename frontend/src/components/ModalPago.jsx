function ModalPago({
  titulo = 'Confirmar pago',
  descripcion,
  monto,
  procesando = false,
  error = '',
  onConfirmar,
  onCancelar
}) {
  const formatearPrecio = (precio) =>
    Number(precio || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-pago"
      >
        <div className="flex justify-between items-center mb-2">
          <h2
            id="titulo-modal-pago"
            className="text-xl font-bold text-gray-800"
          >
            {titulo}
          </h2>

          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {descripcion && (
          <p className="text-sm text-gray-500 mb-4">
            {descripcion}
          </p>
        )}

        <div className="bg-pink-50 rounded-xl p-4 text-center my-4">
          <p className="text-sm text-gray-500">
            Importe a pagar
          </p>

          <p
            className="text-3xl font-bold mt-1"
            style={{ color: '#FF4DB8' }}
          >
            {formatearPrecio(monto)}
          </p>
        </div>

        <h3 className="font-semibold text-gray-800 mb-3">
          Datos de transferencia
        </h3>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
          <div>
            <p className="text-sm text-gray-500">Titular</p>
            <p className="font-semibold">Picusin Mangas</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Alias</p>
            <p className="font-semibold">PICUSIN.DEMO</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">CVU</p>
            <p className="font-semibold break-all">
              0000000000000000000000
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Entorno de prueba. No envíes dinero a estos datos.
        </p>

        {error && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 rounded-xl p-3 mb-4 text-sm"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onConfirmar}
          disabled={procesando}
          className="w-full px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#FF4DB8' }}
        >
          {procesando ? 'Procesando pago...' : 'Confirmar pago'}
        </button>

        <button
          type="button"
          onClick={onCancelar}
          disabled={procesando}
          className="w-full mt-3 px-5 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default ModalPago