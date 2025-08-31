import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
// Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
