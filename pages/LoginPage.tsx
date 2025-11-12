import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useResume } from '../state/ResumeContext';
import './login.css';

export function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const { setToken, setResume } = useResume();

	// Local server endpoint
	const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError('');
		// Call the local server API
		try {
			const resp = await fetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});
			if (resp.ok) {
				const data = await resp.json();
				console.log('🔍 Login response data:', data);
				console.log('🔍 User ID from login:', data?.user?.id);
				if (data?.token && data?.user?.id) {
					setToken(data.token);
					// Save user data to sessionStorage for later use
					sessionStorage.setItem('user', JSON.stringify(data.user));
					// Load resumes from local server
					try {
						const resumeUrl = `${API_BASE}/api/resumes/${data.user.id}`;
						console.log('🔍 Fetching resumes from:', resumeUrl);
						const resumeResp = await fetch(resumeUrl);
						if (resumeResp.ok) {
							const resumeData = await resumeResp.json();
							console.log('🔍 Resume data received:', resumeData);
							if (resumeData.resumes && resumeData.resumes.length > 0) {
								const latestResume = resumeData.resumes[0];
								console.log('🔍 Latest resume for user:', latestResume);
								console.log('🔍 Resume userId:', latestResume.userId, 'Expected:', data.user.id);
								setResume(() => ({
									fullName: latestResume.fullName || '',
									email: latestResume.email || '',
									phone: latestResume.phone || '',
									location: latestResume.location || '',
									summary: latestResume.summary || '',
									skills: latestResume.skills || [],
									education: latestResume.education || [],
									experience: latestResume.experience || [],
									projects: latestResume.projects || [],
									links: latestResume.links || [],
								}));
							} else {
								console.log('🔍 No resumes found for user');
							}
						}
					} catch (err) {
						console.error('Failed to fetch resume from local server:', err);
					}
					navigate('/app');
					return;
				}
			}
		} catch (err) {
			console.error('Auth API call failed:', err);
			setError('Invalid credentials.');
			return;
		}
		// If backend auth fails or returns no token, show a generic error
		setError('Invalid credentials.');
	}

	return (
		<div className="login-wrap">
			<div className="login-card">
				<h1>Sign in</h1>
				{/* Removed dev credentials hint */}
				<form onSubmit={onSubmit} className="login-form">
					<label>
						<span>Username</span>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder=""
							autoComplete="username"
						/>
					</label>
					<label>
						<span>Password</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder=""
							autoComplete="current-password"
						/>
					</label>
					{error && <div className="error">{error}</div>}
					<button type="submit" className="primary">
						Continue
					</button>
				</form>
				<p className="links">
					<Link to="/">Back</Link>
					{' · '}
					<Link to="/signup">Sign up</Link>
				</p>
			</div>
		</div>
	);
}


