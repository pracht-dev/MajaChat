import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import AppLayout from './routes/AppLayout';
import Welcome from './routes/Welcome';
import Chat from './routes/Chat';
import './index.css';

function isStarted() {
  return localStorage.getItem('chat.started') === '1';
}

function WelcomeGate() {
  return isStarted() ? <Navigate to="/chat" replace /> : <Welcome />;
}

function ChatGate() {
  return isStarted() ? <Chat /> : <Navigate to="/welcome" replace />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: <WelcomeGate /> },
      { path: 'chat', element: <ChatGate /> },
      { path: '*', element: <Navigate to="/welcome" replace /> },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
