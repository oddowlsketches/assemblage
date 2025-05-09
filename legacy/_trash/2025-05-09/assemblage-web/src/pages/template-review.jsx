import React from 'react'
import ReactDOM from 'react-dom/client'
import { TemplateReview } from '../components/TemplateReview'
import '../styles/legacy-app.css'

// Create new instance only when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root')
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <TemplateReview />
      </React.StrictMode>
    )
  }
})
