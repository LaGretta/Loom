import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './theme/tokens.css'
import './theme/global.css'
import './ui/app.css'
import { injectAllDefs } from './assets/loom'
import App from './App'

// Inject the verbatim SVG symbol/gift/sticker <defs> once before first paint.
injectAllDefs(document)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
