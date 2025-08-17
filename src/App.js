import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppRoutes from "./routes";
import { Toaster } from '@chakra-ui/react';

function App() {
  return (
    <>
        <AppRoutes />
    </>
  );
}

export default App;
