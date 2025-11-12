import { Link } from 'react-router-dom';
import './intro.css';

export function IntroPage() {
	return (
		<div className="intro">
			<header className="intro-header">
				<div className="header-container">
						<div className="brand">
						<div className="brand-icon">📄</div>
						CareerCur8or
					</div>
					<nav>
						<Link to="/login" className="btn">
							Sign In
						</Link>
					</nav>
				</div>
			</header>

			<main className="intro-main">
				<section className="hero-section">
					<div className="hero-grid">
						{/* Left Column - Text Content */}
						<div className="hero-text">
							<div className="badge">
								<span className="badge-icon">⚡</span>
								<span>AI-Powered Resume Optimization</span>
							</div>

							<h1>
								Land Your Dream Job with{' '}
								<span className="gradient-text">AI-Optimized Resumes</span>
							</h1>

							<p className="subtitle">
								Transform your resume for every job application. Our AI analyzes job
								descriptions and suggests precise improvements to help you stand out
								and get more interviews.
							</p>

							<div className="cta-buttons">
								<Link to="/login" className="cta-primary">
									Get Started Free
									<span className="arrow">→</span>
								</Link>
								<button className="cta-secondary">Watch Demo</button>
							</div>
						</div>

						{/* Right Column - Illustration */}
						<div className="hero-illustration">
							<div className="illustration-glow"></div>
							<div className="illustration-placeholder">
								<div className="resume-icon">📋</div>
								<div className="floating-check">✓</div>
							</div>
						</div>
					</div>
				</section>

				{/* Feature Cards Section */}
				<section className="features-section">
					<div className="features-card">
						<div className="features-glow"></div>
						<div className="features-grid">
							<div className="feature-item">
								<div className="feature-icon blue">🎯</div>
								<div className="feature-content">
									<h3>Smart Resume Curation</h3>
									<p>
										Automatically tailor your resume to match any job description with
										AI-powered suggestions.
									</p>
								</div>
							</div>
							<div className="feature-item">
								<div className="feature-icon purple">🤖</div>
								<div className="feature-content">
									<h3>Career Chatbot</h3>
									<p>
										Get personalized career advice and guidance from our intelligent
										chatbot assistant.
									</p>
								</div>
							</div>
							<div className="feature-item">
								<div className="feature-icon green">💼</div>
								<div className="feature-content">
									<h3>Auto-Apply to Jobs</h3>
									<p>
										Let our system automatically apply to relevant job openings on your
										behalf.
									</p>
								</div>
							</div>
							<div className="feature-item">
								<div className="feature-icon orange">✨</div>
								<div className="feature-content">
									<h3>Interview Prep</h3>
									<p>
										Prepare for interviews with custom questions and practice sessions
										tailored to your role.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Benefits Section */}
				<section className="benefits-section">
					<div className="benefits-header">
						<h2>Why Choose CareerCur8or?</h2>
						<p>
							Join thousands of job seekers who have transformed their career journey
						</p>
					</div>
					<div className="benefits-grid">
						<div className="benefit-item">
							<span className="check-icon">✓</span>
							<span>Save hours of resume customization</span>
						</div>
						<div className="benefit-item">
							<span className="check-icon">✓</span>
							<span>Increase your interview callback rate by 3x</span>
						</div>
						<div className="benefit-item">
							<span className="check-icon">✓</span>
							<span>Get expert career advice 24/7</span>
						</div>
						<div className="benefit-item">
							<span className="check-icon">✓</span>
							<span>Track all your applications in one place</span>
						</div>
					</div>
				</section>

				{/* Final CTA Section */}
				<section className="final-cta-section">
					<div className="final-cta-card">
						<h2>Ready to Transform Your Career?</h2>
						<p>Start optimizing your resume in minutes. No credit card required.</p>
						<Link to="/login" className="cta-white">
							Get Started Now
							<span className="arrow">→</span>
						</Link>
					</div>
				</section>
			</main>

			<footer className="intro-footer">
				<div className="footer-container">
					<span>© 2025 CareerCur8or. All rights reserved.</span>
				</div>
			</footer>
		</div>
	);
}


