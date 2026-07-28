import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ChakraProvider } from "@chakra-ui/react"
import './fonts.css';
import system from './components/system';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);
root.render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <App />
   </ChakraProvider>
  </React.StrictMode>
);
