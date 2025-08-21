import React from 'react'
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Home from './screens/Home';
import App from './App';

const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
      { path: "/", element: <Home/> },
      { path: "/home", element:<Home />},

      ]
    }
  ]);


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )