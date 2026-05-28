import './Footer.css'

function Footer({ empresa, anio }) {
  return (
    <footer className="footer">
      <p>© {anio} {empresa} - Todos los derechos reservados</p>
    </footer>
  )
}

export default Footer