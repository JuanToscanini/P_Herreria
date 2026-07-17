import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axiosConfig'
import { getToken } from '../utils/auth'
import Spinner from '../components/Spinner'
import './CheckoutResult.css'

function CheckoutPending() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const ordenId = searchParams.get('external_reference')

  useEffect(() => {
    if (!ordenId) {
      setLoading(false)
      return
    }

    const consultarOrden = async () => {
      try {
        const token = getToken()
        const response = await api.get(`/ordenes/${ordenId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setOrden(response.data)
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo consultar el estado de la orden')
      } finally {
        setLoading(false)
      }
    }

    consultarOrden()
  }, [ordenId])

  if (loading) return <Spinner mensaje="Consultando el estado de tu pago..." />

  return (
    <div className="checkout-result">
      <div className="checkout-result-box">
        <div className="checkout-result-icon warn">⏳</div>
        <h1>Tu pago está pendiente</h1>

        {error && <p className="checkout-result-error">{error}</p>}

        {!error && orden && (
          <>
            <p className="checkout-result-desc">
              MercadoPago todavía está procesando tu pago (estado actual: <strong>{orden.estadoPagoMP}</strong>).
              Esto puede tardar unos minutos, sobre todo con medios de pago como transferencia o efectivo en puntos de pago.
              Te vamos a avisar por mail apenas se confirme.
            </p>
            <p className="checkout-result-order-id">Orden ID: <span>{orden._id}</span></p>
          </>
        )}

        {!error && !orden && (
          <p className="checkout-result-desc">
            No encontramos una referencia de orden en la URL. Podés revisar el estado más tarde en "Mis pedidos".
          </p>
        )}

        <div className="checkout-result-actions">
          <button className="btn-primary" onClick={() => navigate('/pedidos')}>
            Ver mis pedidos
          </button>
          <button className="btn-secondary" onClick={() => navigate('/productos')}>
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPending
