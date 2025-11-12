import { useEffect, useState } from 'react';
import { useResume } from '../state/ResumeContext';
import './export.css';

interface CuratedResumeData {
	id?: number;
	fullName: string;
	email: string;
	phone?: string;
	location?: string;
	summary?: string;
	skills: string[];
	experience: Array<{
		title: string;
		company: string;
		startDate: string;
		endDate: string;
		description?: string;
	}>;
	education: Array<{
		degree: string;
		school: string;
		startYear?: string;
		endYear?: string;
	}>;
	projects?: any[];
	links?: any[];
}

export function ExportTab() {
	const { resume } = useResume();
	const [curatedResume, setCuratedResume] = useState<CuratedResumeData | null>(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [editedResume, setEditedResume] = useState<CuratedResumeData | null>(null);

	useEffect(() => {
		fetchCuratedResume();
	}, []);

	const fetchCuratedResume = async () => {
		const user = JSON.parse(sessionStorage.getItem('user') || '{}');
		if (!user.id) {
			setLoading(false);
			return;
		}

		try {
			const AUTH_API = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/api/auth';
			const baseURL = AUTH_API.replace(/\/api\/auth$/, '');
			
			const response = await fetch(`${baseURL}/api/curated-resume/${user.id}`);
			
			if (response.ok) {
				const data = await response.json();
				setCuratedResume(data.content);
				setEditedResume(data.content);
			} else if (response.status === 404) {
				// No curated resume yet, fall back to full resume
				console.log('No curated resume found, using full resume');
				setCuratedResume(null);
			}
		} catch (error) {
			console.error('Error fetching curated resume:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!editedResume || !curatedResume) return;

		try {
			const user = JSON.parse(sessionStorage.getItem('user') || '{}');
			const AUTH_API = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/api/auth';
			const baseURL = AUTH_API.replace(/\/api\/auth$/, '');
			
			const response = await fetch(`${baseURL}/api/curated-resume/${(curatedResume as any).id || user.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: editedResume })
			});

			if (response.ok) {
				setCuratedResume(editedResume);
				setEditing(false);
				alert('Curated resume updated successfully!');
			} else {
				alert('Failed to save changes');
			}
		} catch (error) {
			console.error('Error saving curated resume:', error);
			alert('Error saving changes');
		}
	};

	const displayResume = editing ? editedResume : (curatedResume || resume);

	const handleExport = async () => {
		// Get the resume HTML element
		const resumeElement = document.getElementById('resume-preview');
		if (!resumeElement) return;

		try {
			// Use html2pdf library to convert HTML to PDF
			const html2pdf = (await import('html2pdf.js')).default;
			
			const opt = {
				margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
				filename: `${resume.fullName || 'resume'}.pdf`,
				image: { type: 'jpeg' as const, quality: 0.98 },
				html2canvas: { 
					scale: 2, 
					useCORS: true,
					letterRendering: true
				},
				jsPDF: { 
					unit: 'in' as const, 
					format: 'letter' as const, 
					orientation: 'portrait' as const
				},
				pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
			};

			html2pdf().set(opt).from(resumeElement).save();
		} catch (error) {
			console.error('Error exporting PDF:', error);
			alert('Failed to export PDF. Please try again.');
		}
	};

	return (
		<div className="export-container">
			<div className="export-controls">
				{loading ? (
					<p>Loading curated resume...</p>
				) : (
					<>
						{!curatedResume && (
							<div className="info-message">
								<p>💡 No curated resume found. Save your profile in the Capture tab to generate an AI-optimized 1-page resume!</p>
							</div>
						)}
						<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
							{editing ? (
								<>
									<button className="primary lg" onClick={handleSave}>
										💾 Save Changes
									</button>
									<button className="secondary lg" onClick={() => {
										setEditedResume(curatedResume);
										setEditing(false);
									}}>
										Cancel
									</button>
								</>
							) : (
								<>
									<button className="primary lg" onClick={handleExport}>
										📄 Export to PDF
									</button>
									{curatedResume && (
										<button className="secondary lg" onClick={() => setEditing(true)}>
											✏️ Edit Resume
										</button>
									)}
								</>
							)}
						</div>
					</>
				)}
			</div>

			<div className="resume-preview-wrapper">
				<div id="resume-preview" className="resume-preview">
					{/* Header */}
					<div className="resume-header">
						{editing ? (
							<>
								<input
									className="editable-name"
									value={editedResume?.fullName || ''}
									onChange={(e) => setEditedResume(prev => prev ? {...prev, fullName: e.target.value} : null)}
								/>
								<div className="editable-contact">
									<input
										placeholder="Email"
										value={editedResume?.email || ''}
										onChange={(e) => setEditedResume(prev => prev ? {...prev, email: e.target.value} : null)}
									/>
									<input
										placeholder="Phone"
										value={editedResume?.phone || ''}
										onChange={(e) => setEditedResume(prev => prev ? {...prev, phone: e.target.value} : null)}
									/>
									<input
										placeholder="Location"
										value={editedResume?.location || ''}
										onChange={(e) => setEditedResume(prev => prev ? {...prev, location: e.target.value} : null)}
									/>
								</div>
							</>
						) : (
							<>
								<h1 className="resume-name">{displayResume?.fullName}</h1>
								<div className="resume-contact">
									{displayResume?.email && <span>{displayResume.email}</span>}
									{displayResume?.phone && <span>{displayResume.phone}</span>}
									{displayResume?.location && <span>{displayResume.location}</span>}
									{displayResume?.links && displayResume.links.map((link: any, i: number) => (
										<span key={i}>{link.url || link.label}</span>
									))}
								</div>
							</>
						)}
					</div>

					{/* Summary */}
					{(editing || displayResume?.summary) && (
						<div className="resume-section">
							<h2 className="resume-section-title">Summary</h2>
							{editing ? (
								<textarea
									className="editable-summary"
									value={editedResume?.summary || ''}
									onChange={(e) => setEditedResume(prev => prev ? {...prev, summary: e.target.value} : null)}
									rows={3}
								/>
							) : (
								<p className="resume-summary">{displayResume?.summary}</p>
							)}
						</div>
					)}

					{/* Skills */}
					{displayResume?.skills && displayResume.skills.length > 0 && (
						<div className="resume-section">
							<h2 className="resume-section-title">Skills</h2>
							<div className="resume-skills">
								{editing ? (
									<input
										className="editable-skills"
										value={editedResume?.skills.join(', ') || ''}
										onChange={(e) => setEditedResume(prev => prev ? {...prev, skills: e.target.value.split(',').map(s => s.trim())} : null)}
										placeholder="Comma-separated skills"
									/>
								) : (
									<p>{displayResume.skills.join(', ')}</p>
								)}
							</div>
						</div>
					)}

					{/* Experience */}
					{displayResume?.experience && displayResume.experience.length > 0 && (
						<div className="resume-section">
							<h2 className="resume-section-title">Experience</h2>
							{displayResume.experience.map((exp: any, i: number) => (
								<div key={i} className="resume-item">
									<div className="resume-item-header">
										<div className="resume-item-left">
											<strong>{exp.title}</strong>
										</div>
										<div className="resume-item-right">
											{exp.startDate && exp.endDate && (
												<span>{exp.startDate} - {exp.endDate}</span>
											)}
										</div>
									</div>
									{exp.description && <div className="resume-item-subtitle">{exp.description}</div>}
								</div>
							))}
						</div>
					)}

					{/* Work Experience */}
					{resume.experience.length > 0 && (
						<div className="resume-section">
							<h2 className="resume-section-title">Work Experience</h2>
							{resume.experience.map((exp, i) => (
								<div key={i} className="resume-item">
									<div className="resume-item-header">
										<div className="resume-item-left">
											<strong>{exp.title}</strong> | {exp.company}
										</div>
										<div className="resume-item-right">
											{exp.startDate && exp.endDate && (
												<span>{exp.startDate} - {exp.endDate}</span>
											)}
										</div>
									</div>
									{exp.description && (
										<ul className="resume-list">
											{exp.description.split('\n').filter(line => line.trim()).map((line, idx) => (
												<li key={idx}>{line.replace(/^[•\-–]\s*/, '')}</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					)}

					{/* Projects */}
					{resume.projects.length > 0 && (
						<div className="resume-section">
							<h2 className="resume-section-title">Projects</h2>
							{resume.projects.map((proj, i) => (
								<div key={i} className="resume-item">
									<div className="resume-item-header">
										<div className="resume-item-left">
											<strong>{proj.name}</strong>
											{proj.link && <span className="project-link"> | {proj.link}</span>}
										</div>
									</div>
									{proj.description && <p className="resume-item-description">{proj.description}</p>}
									{proj.technologies && (
										<p className="resume-item-tech">Technologies: {proj.technologies}</p>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
