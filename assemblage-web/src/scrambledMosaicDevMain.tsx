import React from 'react';
import { createRoot } from 'react-dom/client';
import DevHarness from './templates/scrambledMosaic/devHarness';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevHarness />
  </React.StrictMode>
); 