import './Spinner.css'

function Spinner({ mensaje = 'Cargando...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>{mensaje}</p>
    </div>
  )
}

export default Spinner