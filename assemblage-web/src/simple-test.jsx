import React from 'react';
import { createRoot } from 'react-dom/client';
import { SimpleTest } from './components/SimpleTest';

const root = createRoot(document.getElementById('root'));
root.render(<SimpleTest />); 