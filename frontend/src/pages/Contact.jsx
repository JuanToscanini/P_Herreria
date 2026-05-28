import { useState } from 'react'
import './Contact.css'

function Contact() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Formulario enviado:', form)
    alert('Mensaje enviado correctamente')
    setForm({ nombre: '', email: '', mensaje: '' })
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
            placeholder="Tu nombre"
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
            placeholder="Tu email"
            required
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
        <button type="submit">Enviar mensaje</button>
      </form>
    </div>
  )
}

export default Contact
