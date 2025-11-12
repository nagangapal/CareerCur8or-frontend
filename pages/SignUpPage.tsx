import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';

export function SignUpPage() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// Local server endpoint
	const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError('');

		// Validation
		if (!username || !email || !password) {
			setError('All fields are required');
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}

		setLoading(true);

		try {
			// Use local server for signup
			const resp = await fetch(`${API_BASE}/api/auth/signup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password }),
			});

			const data = await resp.json();

			if (resp.ok && data.success) {
				// Signup successful, redirect to login
				alert('Account created successfully! Please log in.');
				navigate('/login');
			} else {
				setError(data.error || 'Signup failed. Username may already exist.');
			}
		} catch (err) {
			console.error('Signup error:', err);
			setError('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-wrap">
			<div className="login-card">
				<h1>Sign up</h1>
				<form onSubmit={onSubmit} className="login-form">
					<label>
						<span>Username</span>
						<input
							type="text"
							placeholder=""
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={loading}
							autoComplete="username"
						/>
					</label>

					<label>
						<span>Email</span>
						<input
							type="email"
							placeholder=""
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={loading}
							autoComplete="email"
						/>
					</label>

					<label>
						<span>Password</span>
						<input
							type="password"
							placeholder=""
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
							autoComplete="new-password"
						/>
					</label>

					<label>
						<span>Confirm Password</span>
						<input
							type="password"
							placeholder=""
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={loading}
							autoComplete="new-password"
						/>
					</label>

					{error && <div className="error">{error}</div>}

					<button type="submit" className="primary" disabled={loading}>
						{loading ? 'Creating Account...' : 'Sign Up'}
					</button>
				</form>

				<p className="links">
					<Link to="/">Back</Link>
					{' · '}
					<Link to="/login">Log in</Link>
				</p>
			</div>
		</div>
	);
}
