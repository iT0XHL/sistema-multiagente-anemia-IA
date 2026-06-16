import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
// El CSS de Tailwind se compila aparte (CLI) a public/styles.css y se enlaza
// desde index.html; no se importa aquí para evitar el bug de "!" en la ruta.

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
