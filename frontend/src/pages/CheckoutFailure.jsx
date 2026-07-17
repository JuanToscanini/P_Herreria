import { useNavigate, useSearchParams } from 'react-router-dom'
import './CheckoutResult.css'

function CheckoutFailure() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ordenId = searchParams.get('external_reference')

  return (
    <div className="checkout-result">
      <div className="checkout-result-box">
        <div className="checkout-result-icon fail">✕</div>
        <h1>No pudimos procesar tu pago</h1>
        <p className="checkout-result-desc">
          El pago fue rechazado o se canceló antes de completarse. No te preocupés,
          tu pedido no se perdió: podés intentar de nuevo desde "Mis pedidos" o el carrito.
        </p>
        {ordenId && <p className="checkout-result-order-id">Orden ID: <span>{ordenId}</span></p>}

        <div className="checkout-result-actions">
          <button className="btn-primary" onClick={() => navigate('/carrito')}>
            Volver al carrito
          </button>
          <button className="btn-secondary" onClick={() => navigate('/pedidos')}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutFailure
