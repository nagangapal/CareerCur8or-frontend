import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { IntroPage } from './pages/IntroPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProtectedApp } from './pages/ProtectedApp';
import { ResumeProvider } from './state/ResumeContext';

const router = createBrowserRouter([
	{ path: '/', element: <IntroPage /> },
	{ path: '/login', element: <LoginPage /> },
	{ path: '/signup', element: <SignUpPage /> },
	{ path: '/app', element: <ProtectedApp /> },
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ResumeProvider>
			<RouterProvider router={router} />
		</ResumeProvider>
	</StrictMode>,
);
