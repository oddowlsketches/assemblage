import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MaskReview from './MaskReview'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MaskReview />} />
        <Route path="/mask-review" element={<MaskReview />} />
        <Route path="/mask-review.html" element={<MaskReview />} />
        <Route path="*" element={<MaskReview />} />
      </Routes>
    </Router>
  )
}

export default App 