import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const redirect = searchParams.get('redirect') || '/productos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('El correo electrónico es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Instrucciones enviadas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password">
      <div className="forgot-box">
        <h1>Recuperar contraseña</h1>
        
        {!sent ? (
          <>
            <p className="forgot-desc">
              Ingresá tu correo electrónico registrado y te enviaremos un enlace para que puedas cambiar tu contraseña.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
            </form>
          </>
        ) : (
          <div className="forgot-success-message">
            <p>
              Si el correo ingresado corresponde a un usuario registrado, recibirás un mensaje con instrucciones en breve.
            </p>
            <p>Por favor, revisá tu casilla de correo (y la carpeta de spam).</p>
            <button className="btn-back-login" onClick={() => navigate(`/login${redirect !== '/productos' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`)}>
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {!sent && (
          <p className="forgot-back">
            <Link to={`/login${redirect !== '/productos' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
              Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
