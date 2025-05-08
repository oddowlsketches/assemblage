import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TemplateReview } from './components/TemplateReview'
import './styles/legacy-app.css'

// Get current path
const path = window.location.pathname;

// Determine which component to render based on path
let Component = App;
if (path.includes('template-review.html')) {
  Component = TemplateReview;
}

// Create root and render
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
