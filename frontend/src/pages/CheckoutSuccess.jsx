import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axiosConfig'
import { getToken } from '../utils/auth'
import Spinner from '../components/Spinner'
import './CheckoutResult.css'

function CheckoutSuccess() {
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

  if (loading) return <Spinner mensaje="Verificando el estado de tu pago..." />

  // No asumimos que el pago está confirmado solo por haber llegado a esta URL:
  // mostramos el estadoPagoMP real que devolvió el backend.
  const aprobado = orden?.estadoPagoMP === 'aprobado'

  return (
    <div className="checkout-result">
      <div className="checkout-result-box">
        <div className={`checkout-result-icon ${aprobado ? 'ok' : 'warn'}`}>
          {aprobado ? '✓' : '⏳'}
        </div>
        <h1>{aprobado ? '¡Pago aprobado!' : 'Estamos confirmando tu pago'}</h1>

        {error && <p className="checkout-result-error">{error}</p>}

        {!error && orden && (
          <>
            <p className="checkout-result-desc">
              {aprobado
                ? 'Tu pago fue aprobado y tu pedido ya está confirmado.'
                : `El estado actual de tu pago es "${orden.estadoPagoMP}". Te vamos a avisar por mail apenas se confirme.`}
            </p>
            <p className="checkout-result-order-id">Orden ID: <span>{orden._id}</span></p>
          </>
        )}

        {!error && !orden && (
          <p className="checkout-result-desc">
            No encontramos una referencia de orden en la URL. Si ya realizaste el pago, revisá el estado en "Mis pedidos".
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

export default CheckoutSuccess
