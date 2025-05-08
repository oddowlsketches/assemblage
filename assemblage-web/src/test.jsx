import React from 'react';
import { createRoot } from 'react-dom/client';
import { TestComponent } from './components/TestComponent';

const root = createRoot(document.getElementById('root'));
root.render(<TestComponent />); 