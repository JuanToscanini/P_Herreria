import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { getToken } from '../utils/auth';
import api from '../api/axiosConfig';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  // Formulario Checkout
  const [facturacion, setFacturacion] = useState({
    nombreCompleto: '',
    dni: '',
    direccion: ''
  });
  const [envio, setEnvio] = useState(false); // false = Retiro, true = Envio
  const [mismosDatosEnvio, setMismosDatosEnvio] = useState(true);
  const [datosEnvio, setDatosEnvio] = useState({
    nombreCompleto: '',
    dni: '',
    direccion: '',
    telefono: ''
  });
  const [medioPago, setMedioPago] = useState('efectivo'); // efectivo o transferencia

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const parsedUser = JSON.parse(usuarioGuardado);
      setUsuario(parsedUser);
      setFacturacion(prev => ({ ...prev, nombreCompleto: parsedUser.nombre }));
    }
  }, []);

  const handleFacturacionChange = (e) => {
    setFacturacion({ ...facturacion, [e.target.name]: e.target.value });
  };

  const handleEnvioChange = (e) => {
    setDatosEnvio({ ...datosEnvio, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!usuario) {
      toast.error('Debés iniciar sesión para finalizar la compra');
      return;
    }

    if (!facturacion.nombreCompleto || !facturacion.dni || !facturacion.direccion) {
      toast.error('Completá todos los datos de facturación');
      return;
    }

    let finalDatosEnvio = {};
    if (envio) {
      if (mismosDatosEnvio) {
        if (!datosEnvio.telefono) {
          toast.error('Ingresá un teléfono para el envío');
          return;
        }
        finalDatosEnvio = {
          nombreCompleto: facturacion.nombreCompleto,
          dni: facturacion.dni,
          direccion: facturacion.direccion,
          telefono: datosEnvio.telefono
        };
      } else {
        if (!datosEnvio.nombreCompleto || !datosEnvio.dni || !datosEnvio.direccion || !datosEnvio.telefono) {
          toast.error('Completá todos los datos de envío');
          return;
        }
        finalDatosEnvio = datosEnvio;
      }
    }

    setLoading(true);
    try {
      const token = getToken();

      const payload = {
        items: cartItems.map(item => ({
          producto: item.producto._id,
          cantidad: item.cantidad
        })),
        facturacion,
        envio,
        datosEnvio: envio ? finalDatosEnvio : undefined,
        medioPago
      };

      const response = await api.post('/ordenes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordenCreada = response.data;

      if (medioPago === 'mercadopago') {
        try {
          const prefResponse = await api.post(`/ordenes/${ordenCreada._id}/preferencia-pago`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          clearCart();
          // Redirect completo al Checkout Pro de MercadoPago, salimos de la SPA.
          window.location.href = prefResponse.data.init_point;
          return;
        } catch (prefErr) {
          // La orden ya se creó (con su stock reservado) aunque no se pudo iniciar
          // el pago; mostramos igual el resumen para que el usuario no la pierda.
          toast.error(prefErr.response?.data?.error || 'No se pudo iniciar el pago con MercadoPago');
          setPedidoCreado(ordenCreada);
          clearCart();
          return;
        }
      }

      setPedidoCreado(ordenCreada);
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Formateador de moneda argentina
  const formatPesos = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(Number(value || 0));
  };

  // Si el pedido fue creado con éxito
  if (pedidoCreado) {
    return (
      <div className="cart-success">
        <div className="success-box">
          <div className="success-icon">✓</div>
          <h1>¡Pedido realizado con éxito!</h1>
          <p className="success-order-id">Orden ID: <span>{pedidoCreado._id}</span></p>
          <p className="success-desc">Hemos enviado un correo electrónico a tu casilla confirmando la orden.</p>
          
          {pedidoCreado.medioPago === 'transferencia' && (
            <div className="bank-details">
              <h3>Datos de Transferencia</h3>
              <p>Por favor realiza la transferencia bancaria y envianos el comprobante:</p>
              <ul>
                <li><strong>Banco:</strong> Banco Nación</li>
                <li><strong>CBU:</strong> 0110000000000000000000</li>
                <li><strong>Alias:</strong> herreria.ledesma.mp</li>
                <li><strong>Titular:</strong> Herrería Ledesma S.H.</li>
                <li><strong>Monto a transferir:</strong> <span className="monto-transferir">{formatPesos(pedidoCreado.total)}</span></li>
              </ul>
            </div>
          )}

          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/pedidos')}>
              Ver mis pedidos
            </button>
            <button className="btn-secondary" onClick={() => navigate('/productos')}>
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si el carrito está vacío
  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-box">
          <h2>Tu carrito está vacío</h2>
          <p>Explorá nuestro catálogo y sumá productos de herrería artesanal.</p>
          <button className="btn-primary" onClick={() => navigate('/productos')}>
            Ver productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Carrito de Compras</h1>
      
      <div className="cart-container">
        {/* Tabla / Lista de Items */}
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.producto._id} className="cart-item">
                <div className="item-img-container">
                  {item.producto.imagenes && item.producto.imagenes.length > 0 ? (
                    <img src={item.producto.imagenes[0]} alt={item.producto.nombre} className="item-img" />
                  ) : (
                    <div className="item-img-placeholder">Sin imagen</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>{item.producto.nombre}</h3>
                  <p className="item-category">{item.producto.categoria}</p>
                  <p className="item-unit-price">Unitario: {formatPesos(item.producto.precio)}</p>
                </div>
                <div className="item-quantity-controls">
                  <button onClick={() => updateQuantity(item.producto._id, item.cantidad - 1)}>-</button>
                  <span className="qty-value">{item.cantidad}</span>
                  <button onClick={() => updateQuantity(item.producto._id, item.cantidad + 1)}>+</button>
                </div>
                <div className="item-subtotal">
                  {formatPesos(item.producto.precio * item.cantidad)}
                </div>
                <button className="btn-item-remove" onClick={() => removeFromCart(item.producto._id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-actions">
            <button className="btn-clear-cart" onClick={clearCart}>
              Vaciar carrito
            </button>
            <div className="cart-total-display">
              Total: <span>{formatPesos(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* Sección Checkout / Facturación */}
        <div className="checkout-section">
          <h2>Finalizar Compra</h2>
          
          {!usuario ? (
            <div className="checkout-login-prompt">
              <p>Debés iniciar sesión en tu cuenta para poder finalizar la compra.</p>
              <div className="prompt-actions">
                <button className="btn-primary" onClick={() => navigate('/login?redirect=/carrito')}>
                  Iniciar sesión
                </button>
                <button className="btn-secondary" onClick={() => navigate('/registro?redirect=/carrito')}>
                  Crear cuenta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="checkout-form">
              {/* Facturacion */}
              <div className="form-group-section">
                <h3>1. Datos de Facturación</h3>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={facturacion.nombreCompleto}
                    onChange={handleFacturacionChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>DNI</label>
                  <input
                    type="text"
                    name="dni"
                    value={facturacion.dni}
                    onChange={handleFacturacionChange}
                    placeholder="Sin puntos ni espacios"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={facturacion.direccion}
                    onChange={handleFacturacionChange}
                    placeholder="Calle, Altura, Localidad"
                    required
                  />
                </div>
              </div>

              {/* Modo de Entrega */}
              <div className="form-group-section">
                <h3>2. Forma de Entrega</h3>
                <div className="radio-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="envio"
                      checked={!envio}
                      onChange={() => setEnvio(false)}
                    />
                    <span>Retirar en local (Gratis)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="envio"
                      checked={envio}
                      onChange={() => setEnvio(true)}
                    />
                    <span>Envío a domicilio</span>
                  </label>
                </div>

                {envio && (
                  <div className="shipping-subform">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={mismosDatosEnvio}
                        onChange={(e) => setMismosDatosEnvio(e.target.checked)}
                      />
                      <span>Mismos datos de facturación</span>
                    </label>

                    {mismosDatosEnvio ? (
                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label>Teléfono de contacto</label>
                        <input
                          type="text"
                          name="telefono"
                          value={datosEnvio.telefono}
                          onChange={handleEnvioChange}
                          placeholder="Tu número telefónico"
                          required
                        />
                      </div>
                    ) : (
                      <div className="shipping-fields">
                        <div className="form-group">
                          <label>Destinatario (Nombre Completo)</label>
                          <input
                            type="text"
                            name="nombreCompleto"
                            value={datosEnvio.nombreCompleto}
                            onChange={handleEnvioChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>DNI</label>
                          <input
                            type="text"
                            name="dni"
                            value={datosEnvio.dni}
                            onChange={handleEnvioChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Dirección de Envío</label>
                          <input
                            type="text"
                            name="direccion"
                            value={datosEnvio.direccion}
                            onChange={handleEnvioChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Teléfono de contacto</label>
                          <input
                            type="text"
                            name="telefono"
                            value={datosEnvio.telefono}
                            onChange={handleEnvioChange}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Medio de Pago */}
              <div className="form-group-section">
                <h3>3. Medio de Pago</h3>
                <div className="radio-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="medioPago"
                      value="efectivo"
                      checked={medioPago === 'efectivo'}
                      onChange={() => setMedioPago('efectivo')}
                    />
                    <span>Efectivo en el local</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="medioPago"
                      value="transferencia"
                      checked={medioPago === 'transferencia'}
                      onChange={() => setMedioPago('transferencia')}
                    />
                    <span>Transferencia bancaria</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="medioPago"
                      value="mercadopago"
                      checked={medioPago === 'mercadopago'}
                      onChange={() => setMedioPago('mercadopago')}
                    />
                    <span>MercadoPago</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary btn-checkout-submit" disabled={loading}>
                {loading
                  ? 'Procesando...'
                  : medioPago === 'mercadopago'
                    ? 'Pagar con MercadoPago'
                    : 'Realizar pedido'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;
