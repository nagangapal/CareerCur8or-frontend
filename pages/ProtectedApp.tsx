import { Navigate } from 'react-router-dom';
import { useResume } from '../state/ResumeContext';
import { useState } from 'react';
import { ProfileTab } from '../sections/ProfileTab';
import { CuratorTab } from '../sections/CuratorTab';
import { ExportTab } from '../sections/ExportTab';
import './app.css';

export function ProtectedApp() {
	const { isAuthenticated, logout } = useResume();
	const [tab, setTab] = useState<'profile' | 'curator' | 'export'>('profile');

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	const renderTab = () => {
		switch (tab) {
			case 'profile':
				return <ProfileTab />;
			case 'curator':
				return <CuratorTab />;
			case 'export':
				return <ExportTab />;
			default:
				return <ProfileTab />;
		}
	};

	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="brand">CareerCur8or</div>
				<nav className="tabs">
					<button
						className={tab === 'profile' ? 'active' : ''}
						onClick={() => setTab('profile')}
					>
						Profile
					</button>
					<button
						className={tab === 'curator' ? 'active' : ''}
						onClick={() => setTab('curator')}
					>
						Chat
					</button>
					<button
						className={tab === 'export' ? 'active' : ''}
						onClick={() => setTab('export')}
					>
						Export
					</button>
				</nav>
				<button className="logout" onClick={logout}>
					Logout
				</button>
			</header>
			<main className="app-main">{renderTab()}</main>
		</div>
	);
}


