import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useResume } from '../state/ResumeContext';
import './profile.css';

export function ProfileTab() {
	const { resume, setResume } = useResume();
	const [linkedInFile, setLinkedInFile] = useState<File | null>(null);
	const [parsingLinkedIn, setParsingLinkedIn] = useState(false);
	const [parsingResume, setParsingResume] = useState(false);
	const fileRef = useRef<HTMLInputElement | null>(null);
	const linkedInFileRef = useRef<HTMLInputElement | null>(null);

	function update<K extends keyof typeof resume>(key: K, value: (typeof resume)[K]) {
		setResume((prev) => ({ ...prev, [key]: value }));
	}

	function addSkill(skill: string) {
		if (!skill) return;
		update('skills', Array.from(new Set([...(resume.skills || []), skill.trim()])));
	}
	
	function removeSkill(skill: string) {
		update('skills', resume.skills?.filter(s => s !== skill) || []);
	}

	async function onUpload(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		
		// Use local Docker parser service
		const PARSER_API = import.meta.env.VITE_PARSER_URL || 'http://localhost:8080';
		
		setParsingResume(true);
		console.log('🔍 FRONTEND DEBUG: Starting resume upload...');
		
		try {
			console.log('🔍 FRONTEND DEBUG: Using parser at:', PARSER_API);
			
			const form = new FormData();
			form.append('resume', file);
			
			console.log('🔍 FRONTEND DEBUG: Sending request to parser...');
			const resp = await fetch(`${PARSER_API}/parse-resume`, {
				method: 'POST',
				body: form,
			});
			console.log('🔍 FRONTEND DEBUG: Parser responded with status:', resp.status);
			
			if (!resp.ok) {
				const err = await resp.json().catch(() => ({}));
				console.error('🔍 FRONTEND DEBUG: Parser error:', err);
				alert(`Failed to parse resume${err?.message ? `: ${err.message}` : ''}`);
				return;
			}
			const data = await resp.json();
			console.log('🔍 FRONTEND DEBUG: Received data from parser:', data);
			console.log('🔍 FRONTEND DEBUG: fullName:', data?.extracted?.fullName);
			console.log('🔍 FRONTEND DEBUG: Education count:', data?.extracted?.education?.length);
			console.log('🔍 FRONTEND DEBUG: Education data:', JSON.stringify(data?.extracted?.education, null, 2));
			console.log('🔍 FRONTEND DEBUG: Experience count:', data?.extracted?.experience?.length);
			console.log('🔍 FRONTEND DEBUG: Experience data:', JSON.stringify(data?.extracted?.experience, null, 2));
			if (data?.extracted) {
				console.log('🔍 FRONTEND DEBUG: Setting resume state with extracted data...');
				setResume((prev) => ({ ...prev, ...data.extracted }));
				console.log('🔍 FRONTEND DEBUG: Resume state updated!');
			}
		} catch (error) {
			console.error('🔍 FRONTEND DEBUG: Fetch error:', error);
			alert(`Network error: ${(error as Error).message}. Make sure parser service is running at ${PARSER_API}`);
		} finally {
			setParsingResume(false);
		}
	}	async function onParseLinkedIn() {
		if (!linkedInFile) {
			alert('Please select a LinkedIn data export ZIP file');
			return;
		}
		
		setParsingLinkedIn(true);
		try {
			const AUTH_API = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/api/auth';
			const baseURL = AUTH_API.replace(/\/api\/auth$/, '');
			
			const formData = new FormData();
			formData.append('linkedinExport', linkedInFile);
			
			const resp = await fetch(`${baseURL}/api/parse-linkedin`, {
				method: 'POST',
				body: formData,
			});
			
			if (!resp.ok) {
				const err = await resp.json().catch(() => ({}));
				alert(`Failed to parse LinkedIn: ${err?.error || err?.message || 'Unknown error'}`);
				return;
			}
			
			const data = await resp.json();
			if (data?.extracted) {
				setResume((prev) => ({ ...prev, ...data.extracted }));
				alert('LinkedIn data imported successfully!');
				setLinkedInFile(null);
				if (linkedInFileRef.current) {
					linkedInFileRef.current.value = '';
				}
			}
		} catch (error) {
			console.error('LinkedIn parse error:', error);
			alert('Failed to parse LinkedIn export');
		} finally {
			setParsingLinkedIn(false);
		}
	}

	function onAddEducation(e: FormEvent) {
		e.preventDefault();
		update('education', [
			...(resume.education || []),
			{ school: '', degree: '', startYear: '', endYear: '' },
		]);
	}
	
	function onDeleteEducation(index: number) {
		update('education', resume.education?.filter((_, i) => i !== index) || []);
	}

	function onAddExperience(e: FormEvent) {
		e.preventDefault();
		update('experience', [
			...(resume.experience || []),
			{ company: '', title: '', startDate: '', endDate: '', description: '' },
		]);
	}
	
	function onDeleteExperience(index: number) {
		update('experience', resume.experience?.filter((_, i) => i !== index) || []);
	}

	function onAddProject(e: FormEvent) {
		e.preventDefault();
		update('projects', [
			...(resume.projects || []),
			{ name: '', description: '', technologies: '', link: '' },
		]);
	}
	
	function onDeleteProject(index: number) {
		update('projects', resume.projects?.filter((_, i) => i !== index) || []);
	}

	return (
		<div className="profile-grid">
			<section className="profile-section">
				<h2>Basics</h2>
				<div className="basics-row">
					<label>
						<span>Name</span>
						<input value={resume.fullName} onChange={(e) => update('fullName', e.target.value)} />
					</label>
					<label>
						<span>Email</span>
						<input value={resume.email} onChange={(e) => update('email', e.target.value)} />
					</label>
					<label>
						<span>Phone</span>
						<input value={resume.phone} onChange={(e) => update('phone', e.target.value)} />
					</label>
					<label>
						<span>Location</span>
						<input value={resume.location} onChange={(e) => update('location', e.target.value)} />
					</label>
				</div>
				<label className="summary-label">
					<span>Professional Summary</span>
					<textarea
						rows={4}
						value={resume.summary}
						onChange={(e) => update('summary', e.target.value)}
					/>
				</label>
				<label className="skills-input">
					<span>Add skill</span>
					<input
						placeholder="Type a skill and press Enter"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addSkill((e.target as HTMLInputElement).value);
								(e.target as HTMLInputElement).value = '';
							}
						}}
					/>
				</label>
				<div className="skills-list">
					{resume.skills?.map((s) => (
						<span key={s} className="skill-tag">
							{s}
							<button onClick={() => removeSkill(s)} title="Remove skill">
								×
							</button>
						</span>
					))}
				</div>
			</section>
			<section className="profile-section">
				<h2>Import options</h2>
				<div className="import-option">
					<label>
						<span>Resume file (PDF/DOCX)</span>
						<input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={onUpload} />
					</label>
				</div>
				<div className="import-option">
					<label>
						<span>LinkedIn Data Export (ZIP)</span>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
							<input
								ref={linkedInFileRef}
								type="file"
								accept=".zip"
								onChange={(e) => setLinkedInFile(e.target.files?.[0] || null)}
								style={{ flex: 1 }}
							/>
							<button 
								className="primary" 
								onClick={onParseLinkedIn}
								disabled={parsingLinkedIn || !linkedInFile}
							>
								{parsingLinkedIn ? 'Parsing...' : 'Import'}
							</button>
						</div>
						<small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
							Download your data from LinkedIn Settings → Data Privacy → Get a copy of your data
						</small>
					</label>
				</div>
			</section>
			<section className="profile-section full-width">
				<div className="section-header">
					<h2>Education</h2>
					<button className="primary" onClick={onAddEducation}>Add Education</button>
				</div>
				<div className="items-list">
					{(() => {
						console.log('🔍 FRONTEND DEBUG: Rendering education, count:', resume.education?.length);
						console.log('🔍 FRONTEND DEBUG: Education array:', JSON.stringify(resume.education, null, 2));
						return null;
					})()}
					{resume.education?.map((ed, i) => (
						<div key={i} className="item-card">
							<button className="delete-item" onClick={() => onDeleteEducation(i)}>Delete</button>
							<div className="item-grid four-col">
								<label>
									<span>School</span>
									<input placeholder="School" value={ed.school} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, school: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>Degree</span>
									<input placeholder="Degree" value={ed.degree} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, degree: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>Field of Study</span>
									<input placeholder="Field" value={ed.field || ''} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, field: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>Location</span>
									<input placeholder="Location" value={ed.location || ''} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, location: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>Start Year</span>
									<input placeholder="Start" value={ed.startYear} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, startYear: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>End Year</span>
									<input placeholder="End" value={ed.endYear} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, endYear: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>GPA</span>
									<input placeholder="GPA" value={ed.gpa || ''} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, gpa: e.target.value };
										update('education', next);
									}} />
								</label>
								<label>
									<span>Honors</span>
									<input placeholder="Honors" value={ed.honors || ''} onChange={(e) => {
										const next = [...resume.education];
										next[i] = { ...ed, honors: e.target.value };
										update('education', next);
									}} />
								</label>
							</div>
						</div>
					))}
				</div>
			</section>
			<section className="profile-section full-width">
				<div className="section-header">
					<h2>Experience</h2>
					<button className="primary" onClick={onAddExperience}>Add Experience</button>
				</div>
				<div className="items-list">
					{resume.experience?.map((ex, i) => (
						<div key={i} className="item-card">
							<button className="delete-item" onClick={() => onDeleteExperience(i)}>Delete</button>
							<div className="item-grid">
								<label>
									<span>Company</span>
									<input placeholder="Company" value={ex.company} onChange={(e) => {
										const next = [...resume.experience];
										next[i] = { ...ex, company: e.target.value };
										update('experience', next);
									}} />
								</label>
								<label>
									<span>Title</span>
									<input placeholder="Title" value={ex.title} onChange={(e) => {
										const next = [...resume.experience];
										next[i] = { ...ex, title: e.target.value };
										update('experience', next);
									}} />
								</label>
								<label>
									<span>Location</span>
									<input placeholder="Location" value={ex.location || ''} onChange={(e) => {
										const next = [...resume.experience];
										next[i] = { ...ex, location: e.target.value };
										update('experience', next);
									}} />
								</label>
								<label>
									<span>Start Date</span>
									<input placeholder="Start" value={ex.startDate} onChange={(e) => {
										const next = [...resume.experience];
										next[i] = { ...ex, startDate: e.target.value };
										update('experience', next);
									}} />
								</label>
								<label>
									<span>End Date</span>
									<input placeholder="End" value={ex.endDate} onChange={(e) => {
										const next = [...resume.experience];
										next[i] = { ...ex, endDate: e.target.value };
										update('experience', next);
									}} />
								</label>
								<label className="full-width">
									<span>Responsibilities (one per line)</span>
									<textarea 
										placeholder="• Developed features&#10;• Led team meetings&#10;• Improved performance" 
										value={ex.responsibilities?.join('\n') || ex.description || ''} 
										onChange={(e) => {
											const next = [...resume.experience];
											const lines = e.target.value.split('\n').filter(line => line.trim());
											next[i] = { ...ex, responsibilities: lines, description: undefined };
											update('experience', next);
										}} 
									/>
								</label>
							</div>
						</div>
					))}
				</div>
			</section>
			<section className="profile-section full-width">
				<div className="section-header">
					<h2>Projects</h2>
					<button className="primary" onClick={onAddProject}>Add Project</button>
				</div>
				<div className="items-list">
					{resume.projects?.map((proj, i) => (
						<div key={i} className="item-card">
							<button className="delete-item" onClick={() => onDeleteProject(i)}>Delete</button>
							<div className="item-grid">
								<label>
									<span>Project Name</span>
									<input placeholder="Project name" value={proj.name} onChange={(e) => {
										const next = [...resume.projects];
										next[i] = { ...proj, name: e.target.value };
										update('projects', next);
									}} />
								</label>
								<label>
									<span>Technologies</span>
									<input placeholder="e.g., React, Node.js, PostgreSQL" value={proj.technologies || ''} onChange={(e) => {
										const next = [...resume.projects];
										next[i] = { ...proj, technologies: e.target.value };
										update('projects', next);
									}} />
								</label>
								<label className="full-width">
									<span>Link/URL</span>
									<input placeholder="GitHub, demo, or portfolio link" value={proj.link || ''} onChange={(e) => {
										const next = [...resume.projects];
										next[i] = { ...proj, link: e.target.value };
										update('projects', next);
									}} />
								</label>
								<label className="full-width">
									<span>Description</span>
									<textarea placeholder="Brief description of the project" value={proj.description || ''} onChange={(e) => {
										const next = [...resume.projects];
										next[i] = { ...proj, description: e.target.value };
										update('projects', next);
									}} />
								</label>
								<label className="full-width">
									<span>Details/Achievements (one per line)</span>
									<textarea 
										placeholder="• Built scalable backend&#10;• Implemented key features&#10;• Improved performance by 50%" 
										value={proj.responsibilities?.join('\n') || ''} 
										onChange={(e) => {
											const next = [...resume.projects];
											const lines = e.target.value.split('\n').filter(line => line.trim());
											next[i] = { ...proj, responsibilities: lines };
											update('projects', next);
										}} 
									/>
								</label>
							</div>
						</div>
					))}
				</div>
			</section>
			<div className="save-section">
				<button
					className="primary lg"
					onClick={async () => {
						const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
						const user = JSON.parse(sessionStorage.getItem('user') || '{}');
						const resumeData = {
							...resume,
							userId: user.id
						};
						const resp = await fetch(`${API_BASE}/api/resumes`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(resumeData),
						});
					if (resp.ok) {
						const data = await resp.json();
						alert(data.message || 'Resume saved to database successfully!');
					} else {
							const err = await resp.json().catch(() => ({}));
							alert('Failed to save: ' + (err?.error || 'Unknown error'));
						}
					}}
				>
					Save to Database
				</button>
			</div>
			
			{/* Loading Overlay */}
			{parsingResume && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.7)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
					color: 'white',
					fontSize: '1.5rem',
					fontWeight: 'bold'
				}}>
				<div style={{ marginBottom: '1rem' }}>🤖 AI Parsing Your Resume...</div>
				<div style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>
					Extracting education, experience, skills, and more...
				</div>
				<div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.6 }}>
					This may take 2-3 minutes
				</div>
				</div>
			)}
		</div>
	);
}


