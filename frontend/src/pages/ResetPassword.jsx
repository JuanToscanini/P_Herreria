import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import './ResetPassword.css';

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/productos';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contrasena || !confirmarContrasena) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (contrasena.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (contrasena !== confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { contrasena });
      toast.success(response.data.mensaje || 'Contraseña restablecida correctamente');
      navigate(`/login${redirect !== '/productos' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password">
      <div className="reset-box">
        <h1>Nueva contraseña</h1>
        <p className="reset-desc">
          Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <div className="form-group">
            <label>Repetir contraseña</label>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              placeholder="Repetí tu nueva contraseña"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
