import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import { getToken } from '../utils/auth';
import Spinner from '../components/Spinner';
import './Orders.css';

function Orders() {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  
  // Para manejar estado de carga individual por botón de notificación
  const [notifyingIds, setNotifyingIds] = useState({});

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/login');
      return;
    }
    setUsuario(JSON.parse(usuarioGuardado));
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      const token = getToken();
      const response = await api.get('/ordenes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrdenes(response.data);
    } catch (err) {
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (ordenId, campo, nuevoValor) => {
    try {
      const token = getToken();
      await api.patch(`/ordenes/${ordenId}`, { [campo]: nuevoValor }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Estado actualizado correctamente');
      fetchOrdenes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el estado');
    }
  };

  const handleNotificarCliente = async (ordenId) => {
    setNotifyingIds(prev => ({ ...prev, [ordenId]: true }));
    try {
      const token = getToken();
      await api.post(`/ordenes/${ordenId}/notificar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Email de notificación enviado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar la notificación');
    } finally {
      setNotifyingIds(prev => ({ ...prev, [ordenId]: false }));
    }
  };

  // Formateadores
  const formatPesos = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(Number(value || 0));
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Spinner mensaje="Cargando pedidos..." />;

  const esAdmin = usuario?.rol === 'admin';

  // Si no hay órdenes
  if (ordenes.length === 0) {
    return (
      <div className="orders-empty">
        <div className="empty-box">
          <h2>Aún no tenés pedidos</h2>
          <p>Realizá tu primera compra para ver el seguimiento de tus pedidos acá.</p>
          <button className="btn-primary" onClick={() => navigate('/productos')}>
            Empezar a comprar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>{esAdmin ? 'Panel de Pedidos' : 'Mis Pedidos'}</h1>
      
      <div className="orders-list">
        {ordenes.map(orden => {
          // Listas de estados dinámicos
          const estadosPagoDisponibles = ['pendiente de pago', 'pago confirmado', 'cancelado'];
          const estadosEnvioDisponibles = orden.envio
            ? ['pendiente', 'enviado', 'entregado']
            : ['pendiente', 'listo para retiro', 'entregado'];

          return (
            <div key={orden._id} className="order-card">
              {/* Cabecera del pedido */}
              <div className="order-header">
                <div>
                  <p className="order-id">Pedido ID: <span>{orden._id}</span></p>
                  <p className="order-date">{formatFecha(orden.createdAt)}</p>
                </div>
                <div className="order-total-status">
                  <div className="order-total">{formatPesos(orden.total)}</div>
                  {!esAdmin ? (
                    <div className="order-status-badges">
                      <span className={`order-status-badge ${orden.estadoPago.replace(/\s+/g, '-')}`}>
                        PAGO: {orden.estadoPago.toUpperCase()}
                      </span>
                      <span className={`order-status-badge ${orden.estadoEnvio.replace(/\s+/g, '-')}`}>
                        ENVÍO: {orden.estadoEnvio.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="admin-status-control">
                      <select
                        value={orden.estadoPago}
                        onChange={(e) => handleEstadoChange(orden._id, 'estadoPago', e.target.value)}
                        className="status-select"
                      >
                        {estadosPagoDisponibles.map(est => (
                          <option key={est} value={est}>
                            PAGO: {est.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <select
                        value={orden.estadoEnvio}
                        onChange={(e) => handleEstadoChange(orden._id, 'estadoEnvio', e.target.value)}
                        className="status-select"
                      >
                        {estadosEnvioDisponibles.map(est => (
                          <option key={est} value={est}>
                            ENVÍO: {est.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleNotificarCliente(orden._id)}
                        disabled={notifyingIds[orden._id]}
                        className="btn-notify-client"
                      >
                        {notifyingIds[orden._id] ? 'Enviando...' : 'Notificar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del cliente (Solo Admin) */}
              {esAdmin && orden.usuario && (
                <div className="order-customer-details">
                  <h4>Cliente:</h4>
                  <p><strong>Usuario registrado:</strong> {orden.usuario.nombre} ({orden.usuario.email})</p>
                  <p><strong>Facturado a:</strong> {orden.facturacion.nombreCompleto} | DNI: {orden.facturacion.dni} | Direcc: {orden.facturacion.direccion}</p>
                </div>
              )}

              {/* Detalles de entrega y pago */}
              <div className="order-details-grid">
                <div className="details-col">
                  <h4>Facturación y Pago</h4>
                  <p><strong>Facturado a:</strong> {orden.facturacion.nombreCompleto}</p>
                  <p><strong>DNI:</strong> {orden.facturacion.dni}</p>
                  <p><strong>Método de pago:</strong> {orden.medioPago === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo en local'}</p>
                </div>
                <div className="details-col">
                  <h4>Entrega</h4>
                  <p><strong>Tipo:</strong> {orden.envio ? 'Envío a domicilio' : 'Retiro en local'}</p>
                  {orden.envio ? (
                    <>
                      <p><strong>Destinatario:</strong> {orden.datosEnvio?.nombreCompleto}</p>
                      <p><strong>Dirección:</strong> {orden.datosEnvio?.direccion}</p>
                      <p><strong>Teléfono:</strong> {orden.datosEnvio?.telefono}</p>
                    </>
                  ) : (
                    <p>Retira por el local comercial de Herrería Ledesma.</p>
                  )}
                </div>
              </div>

              {/* Items del pedido */}
              <div className="order-items-section">
                <h4>Productos ({orden.items.length})</h4>
                <div className="order-items-list">
                  {orden.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div className="item-row-img-container">
                        {item.producto && item.producto.imagenes && item.producto.imagenes.length > 0 ? (
                          <img src={item.producto.imagenes[0]} alt={item.producto.nombre} className="item-row-img" />
                        ) : (
                          <div className="item-row-img-placeholder">Image</div>
                        )}
                      </div>
                      <div className="item-row-name">
                        {item.producto ? item.producto.nombre : 'Producto no disponible'}
                      </div>
                      <div className="item-row-qty">
                        Cant: {item.cantidad}
                      </div>
                      <div className="item-row-price">
                        {formatPesos(item.precioEnElMomento)}
                      </div>
                      <div className="item-row-subtotal">
                        Subtotal: {formatPesos(item.precioEnElMomento * item.cantidad)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;
