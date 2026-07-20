import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../api/axiosConfig'
import './Contact.css'

function Contact() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    try {
      await api.post('/contacto', form)
      toast.success('Mensaje enviado correctamente')
      setForm({ nombre: '', email: '', telefono: '', mensaje: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact">
      <div className="contact-info">
        <h1>Contacto</h1>
        <p>📧 herrerialedesma@gmail.com</p>
        <p>📞 +54 3442 319059</p>
        <p>📍 Carosini 723</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre*"
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email*"
            required
          />
        </div>
        <div className="form-group">
          <label>Teléfono (opcional)</label>
          <input
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
          />
        </div>
        <div className="form-group">
          <label>Mensaje</label>
          <textarea
            name="mensaje"
            value={form.mensaje}
            onChange={handleChange}
            placeholder="Tu mensaje"
            rows={5}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </div>
  )
}

export default Contact
