import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { useResume } from '../state/ResumeContext';
import './curator.css';

const CHATBOT_API = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:3001';

// Configure marked for better formatting
marked.setOptions({
	breaks: true,
	gfm: true,
});

type ChatMode = 'career-growth' | 'job-match' | null;

interface Message {
	role: 'user' | 'assistant';
	content: string;
	suggestions?: Suggestion[];
}

interface Suggestion {
	type: string;
	action: string;
	originalText: string;
	newText: string;
	reason: string;
	// snake_case aliases from server: old_text/new_text
	old_text?: string;
	new_text?: string;
}

interface ResumeData {
	personalInfo: {
		fullName: string;
		email: string;
		phone?: string;
		location?: string;
	};
	skills: Array<{ name: string; category?: string }>;
	experience: Array<{
		title: string;
		company: string;
		location?: string;
		startDate: string;
		endDate: string;
		description?: string;
		responsibilities?: string[];
	}>;
	education: Array<{
		degree: string;
		institution: string;
		fieldOfStudy?: string;
		startYear: string;
		endYear: string;
		gpa?: string;
		honors?: string;
	}>;
}

export function CuratorTab() {
	const { resume } = useResume();
	const [mode, setMode] = useState<ChatMode>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [pendingSuggestions, setPendingSuggestions] = useState<{[key: number]: Suggestion[]}>({});
	const [applyingChanges, setApplyingChanges] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null; visible: boolean }>({ message: '', type: null, visible: false });
	const [resumeData, setResumeData] = useState<ResumeData | null>(null);
	const [curatedResumeData, setCuratedResumeData] = useState<ResumeData | null>(null);
	const [curatedSummary, setCuratedSummary] = useState<string>('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Load resume data on component mount and when resume context changes
	useEffect(() => {
		if (mode === 'job-match') {
			// Transform resume context data to match ResumeData interface
			const transformedData: ResumeData = {
				personalInfo: {
					fullName: resume.fullName || '',
					email: resume.email || '',
					phone: resume.phone,
					location: resume.location,
				},
				skills: Array.isArray(resume.skills) 
					? resume.skills.map((skill: string) => ({ name: skill }))
					: [],
				experience: Array.isArray(resume.experience) 
					? resume.experience.map(exp => ({
						title: exp.title || '',
						company: exp.company || '',
						location: exp.location,
						startDate: exp.startDate || '',
						endDate: exp.endDate || '',
						description: exp.description,
						responsibilities: exp.responsibilities,
					}))
					: [],
				education: Array.isArray(resume.education)
					? resume.education.map((edu: any) => ({
						degree: edu.degree || '',
						institution: edu.school || '',
						fieldOfStudy: edu.field || edu.fieldOfStudy,
						startYear: edu.startYear || '',
						endYear: edu.endYear || '',
						gpa: edu.gpa,
						honors: edu.honors,
					}))
					: [],
			};
			setResumeData(transformedData);
		}
	}, [mode, resume]);

	const handleModeSelect = (selectedMode: ChatMode) => {
		setMode(selectedMode);
		setMessages([]);
		setPendingSuggestions({});
		
		if (selectedMode === 'career-growth') {
			setMessages([{
				role: 'assistant',
				content: 'Welcome to CareerCur8or — this is a frontend showcase. Interactive AI prompts have been removed.'
			}]);
		} else if (selectedMode === 'job-match') {
			setMessages([{
				role: 'assistant',
				content: 'Job match demo placeholder — interactive AI removed from this showcase.'
			}]);
		}
	};

	const parseSuggestions = (text: string): { cleanText: string; suggestions: Suggestion[] } => {
		const suggestionMarker = 'SUGGESTIONS:';
		const markerIndex = text.indexOf(suggestionMarker);
		
		if (markerIndex === -1) {
			return { cleanText: text, suggestions: [] };
		}

		const cleanText = text.substring(0, markerIndex).trim();
		const suggestionsText = text.substring(markerIndex + suggestionMarker.length).trim();
		
		console.log('📋 Raw suggestions text:', suggestionsText);
		
		try {
			// Remove markdown code block markers if present
			let jsonText = suggestionsText;
			
			// Handle ```json or ``` code blocks
			const codeBlockMatch = suggestionsText.match(/```(?:json)?\s*([\s\S]*?)```/);
			if (codeBlockMatch) {
				jsonText = codeBlockMatch[1].trim();
			}
			
			// Find JSON array in the text
			const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				const suggestions = JSON.parse(jsonMatch[0]);
				console.log('✅ Parsed suggestions:', suggestions);
				return { cleanText, suggestions };
			}
		} catch (e) {
			console.error('❌ Failed to parse suggestions:', e);
			console.error('Raw text was:', suggestionsText);
		}
		
		return { cleanText: text, suggestions: [] };
	};

	const handleSendMessage = async () => {
		if (!input.trim() || !mode) return;

		const userMessage = input.trim();
		setInput('');
		
		setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
		setLoading(true);

		try {
			const user = JSON.parse(sessionStorage.getItem('user') || '{}');
			
			if (!user.id) {
				throw new Error('User not logged in');
			}

			const conversationHistory = messages.map(msg => ({
				role: msg.role,
				content: msg.content
			}));

			console.log('Sending chat request:', { mode, userId: user.id, messageLength: userMessage.length });

			const response = await fetch(`${CHATBOT_API}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: userMessage,
					mode,
					userId: user.id,
					conversationHistory
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Chat API error:', response.status, errorText);
				
				if (response.status === 429) {
					throw new Error('The AI service is busy. Please wait a few seconds and try again.');
				}
				
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
				}
				
				throw new Error(errorData.error || 'Failed to get response from chatbot');
			}

			const data = await response.json();
			console.log('Chat response received, length:', data.message?.length || 0);

			// Prefer structured suggestions returned by the server (top-level)
			let suggestions: Suggestion[] = [];
			let cleanText = data.message || '';

			if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
				suggestions = data.suggestions;
				// If the assistant text is present, try to strip SUGGESTIONS: block
				const parsed = parseSuggestions(data.message || '');
				cleanText = parsed.cleanText || data.message || '';
			} else {
				// Fallback: parse suggestions from assistant message text
				const parsed = parseSuggestions(data.message || '');
				suggestions = parsed.suggestions;
				cleanText = parsed.cleanText;
			}

			console.log('Parsed suggestions count:', suggestions.length);

			setMessages(prev => {
				const newMessages: Message[] = [...prev, {
					role: 'assistant',
					content: cleanText,
					suggestions
				}];

				if (suggestions.length > 0) {
					setPendingSuggestions(pending => ({
						...pending,
						[newMessages.length - 1]: suggestions
					}));
				}

				return newMessages;
			});

		} catch (error) {
			console.error('Chat error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
			setMessages(prev => [...prev, { 
				role: 'assistant', 
				content: `❌ Error: ${errorMessage}`
			}]);
		} finally {
			setLoading(false);
		}
	};

	// Toast helper
	const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
		setToast({ message, type, visible: true });
		setTimeout(() => setToast({ message: '', type: null, visible: false }), duration);
	};

	// Normalizes text for comparison: collapse whitespace, lowercase, remove leading/trailing punctuation/whitespace
	const normalize = (t: string) => (t || '').replace(/\s+/g, ' ').trim().replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').toLowerCase();

	// Apply an experience suggestion (modify/update/remove) to a curated ResumeData object
	const applyExperienceSuggestionToCurated = (curated: ResumeData, suggestion: Suggestion): boolean => {
		const original = (suggestion.old_text ?? suggestion.originalText ?? '').trim();
		const updated = (suggestion.new_text ?? suggestion.newText ?? '').trim();
		const normOriginal = normalize(original);
		const normUpdated = normalize(updated);
		let applied = false;

		// helper to compute simple token overlap score between two strings (0..1)
		const tokenOverlap = (a: string, b: string) => {
			if (!a || !b) return 0;
			const as = a.split(/\s+/).filter(Boolean);
			const bs = b.split(/\s+/).filter(Boolean);
			const aset = new Set(as);
			let common = 0;
			for (const t of bs) if (aset.has(t)) common++;
			return common / Math.max(as.length, bs.length);
		};

		for (let expIndex = 0; expIndex < curated.experience.length; expIndex++) {
			const expItem = curated.experience[expIndex];
			const responsibilities = expItem.responsibilities || [];

			// Try responsibilities list first: normalized equality/substring
			let matchIndex = responsibilities.findIndex(r => {
				const nr = normalize(r);
				if (!nr) return false;
				if (normOriginal && nr === normOriginal) return true;
				if (normOriginal && (nr.includes(normOriginal) || normOriginal.includes(nr))) return true;
				return false;
			});

			// If we couldn't find by exact/substring, try fuzzy token overlap against original, then updated
			if (matchIndex === -1) {
				let bestScore = 0;
				let bestIdx = -1;
				const target = normOriginal || normUpdated;
				if (target) {
					for (let i = 0; i < responsibilities.length; i++) {
						const score = tokenOverlap(normalize(responsibilities[i]), target);
						if (score > bestScore) { bestScore = score; bestIdx = i; }
					}
					if (bestScore >= 0.25) {
						matchIndex = bestIdx;
						console.log(`🔎 Fuzzy matched responsibility index ${bestIdx} with score ${bestScore}`);
					}
				}
			}

			if (matchIndex !== -1) {
				if (suggestion.action === 'remove') {
					const newResponsibilities = [...responsibilities];
					newResponsibilities.splice(matchIndex, 1);
					expItem.responsibilities = newResponsibilities;
				} else {
					const newResponsibilities = [...responsibilities];
					newResponsibilities[matchIndex] = updated || newResponsibilities[matchIndex];
					expItem.responsibilities = newResponsibilities;
				}
				applied = true;
				break;
			}

			// If no responsibilities match, try description text
			if (expItem.description) {
				const desc = expItem.description || '';
				const nDesc = normalize(desc);
				if (normOriginal && nDesc && (nDesc === normOriginal || nDesc.includes(normOriginal) || normOriginal.includes(nDesc))) {
					// Replace entire description
					if (suggestion.action === 'remove') {
						expItem.description = '';
					} else {
						expItem.description = updated || expItem.description;
					}
					applied = true;
					break;
				} else {
					// Try to replace a substring in description
					const origIndex = original ? desc.indexOf(original) : -1;
					if (origIndex !== -1) {
						if (suggestion.action === 'remove') {
							expItem.description = desc.slice(0, origIndex) + desc.slice(origIndex + original.length);
						} else {
							expItem.description = desc.slice(0, origIndex) + updated + desc.slice(origIndex + original.length);
						}
						applied = true;
						break;
					}

					// If still not found and updated exists, try fuzzy match against description
					if (!applied && normUpdated && nDesc) {
						const score = tokenOverlap(nDesc, normUpdated);
						if (score >= 0.25) {
							if (suggestion.action === 'remove') {
								expItem.description = '';
							} else {
							expItem.description = updated || expItem.description;
							}
							applied = true;
							break;
						}
					}
				}
			}
		}

		if (!applied) {
			console.warn('⚠️ applyExperienceSuggestionToCurated: no match found for', original || suggestion.originalText || suggestion.newText);
		}

		return applied;
	};

	const handleApproveSuggestion = async (messageIndex: number, suggestionIndex: number) => {
		const suggestions = pendingSuggestions[messageIndex];
		if (!suggestions) return;

		const suggestion = suggestions[suggestionIndex];
		console.log('🔍 Approving suggestion:', suggestion);

		// helper to read either snake_case or camelCase
		const getOriginal = (s: Suggestion) => (s.old_text ?? s.originalText ?? '').trim();
		const getNew = (s: Suggestion) => (s.new_text ?? s.newText ?? '').trim();
		
		// Immediately apply this suggestion to curated resume
		if (resumeData) {
			// Initialize curated data if not already set
			const curated: ResumeData = curatedResumeData 
				? JSON.parse(JSON.stringify(curatedResumeData))
				: JSON.parse(JSON.stringify(resumeData));
			
			let updatedSummary = curatedSummary || resume.summary || '';

			// Apply the suggestion using available fields (old_text/new_text or originalText/newText)
			if (suggestion.type === 'skill' && suggestion.action === 'add') {
				const newVal = getNew(suggestion);
				console.log('➕ Adding skill:', newVal);
				if (newVal && !curated.skills.find(s => s.name.toLowerCase() === newVal.toLowerCase())) {
					curated.skills.push({ name: newVal });
				}
			} else if (suggestion.type === 'skill' && suggestion.action === 'remove') {
				const oldVal = getOriginal(suggestion);
				console.log('➖ Removing skill:', oldVal);
				curated.skills = curated.skills.filter(s => 
					s.name.toLowerCase() !== oldVal.toLowerCase()
				);
			} else if (suggestion.type === 'summary' && (suggestion.action === 'update' || suggestion.action === 'modify')) {
				console.log('✏️ Updating summary from:', getOriginal(suggestion));
				console.log('✏️ Updating summary to:', getNew(suggestion));
				updatedSummary = getNew(suggestion);
			} else if (suggestion.type === 'experience' && (suggestion.action === 'modify' || suggestion.action === 'update' || suggestion.action === 'remove')) {
				// Use the centralized helper which handles responsibilities and description matching
				applyExperienceSuggestionToCurated(curated, suggestion);
			}

			// Update curated resume state
			console.log('💾 Updating curated resume state');
			console.log('  Updated summary:', updatedSummary);
			console.log('  Updated curated data:', curated);
			setCuratedResumeData(curated);
			setCuratedSummary(updatedSummary);
		}
		
		// Remove this suggestion from pending
		setPendingSuggestions(prev => {
			const newPending = { ...prev };
			newPending[messageIndex] = suggestions.filter((_, idx) => idx !== suggestionIndex);
			if (newPending[messageIndex].length === 0) {
				delete newPending[messageIndex];
			}
			return newPending;
		});

		// Add to approved suggestions message
		setMessages(prev => {
			const newMessages = [...prev];
			const existingApproved = newMessages.find(m => m.role === 'user' && m.content.startsWith('✅ Approved:'));
			
			const approvalText = `${suggestion.type === 'skill' ? (suggestion.action === 'add' ? 'Add skill' : 'Remove skill') : suggestion.type === 'summary' ? 'Update summary' : 'Modify experience'}: ${suggestion.newText || suggestion.originalText}`;
			
			if (existingApproved) {
				existingApproved.content += `\n• ${approvalText}`;
			} else {
				newMessages.push({
					role: 'user',
					content: `✅ Approved: ${approvalText}`
				});
			}
			
			return newMessages;
		});

		// Notify user
		showToast('Suggestion applied', 'success');
	};

	const handleRejectSuggestion = (messageIndex: number, suggestionIndex: number) => {
		setPendingSuggestions(prev => {
			const newPending = { ...prev };
			const suggestions = newPending[messageIndex];
			if (suggestions) {
				newPending[messageIndex] = suggestions.filter((_, idx) => idx !== suggestionIndex);
				if (newPending[messageIndex].length === 0) {
					delete newPending[messageIndex];
				}
			}
			return newPending;
		});

		showToast('Suggestion rejected', 'info');
	};

	// Load the user's provided SUGGESTIONS JSON into the suggestions pane (debug / ad-hoc loader)
	const loadSampleSuggestions = () => {
		const sample = `[{"type":"skill","action":"add","originalText":"Kotlin","newText":"Kotlin"}, {"type":"summary","action":"update","originalText":"Dynamic leader in training with more than 8 years of experience in the tech industry spanning e-commerce, gaming and startup.", "reason":"Align summary with job requirements"}, {"type":"skill","action":"add","originalText":"Docker","newText":"Docker"}, {"type":"skill","action":"remove","originalText":"React Native","newText":""}, {"type":"experience","action":"modify","originalText":"Developed scalable web applications using React, Redux, and TypeScript, serving 100K+ users","newText":"Developed scalable web applications using React, Redux, and TypeScript, achieving high traffic for e-commerce platforms (up to 500k users) and ensuring rapid deployment with CI/CD pipelines.", "reason":"Add metrics and specific technologies"}, {"type":"experience","action":"remove","originalText":"Developed web applications using React","newText":""}]`;

		try {
			const parsed = JSON.parse(sample);
			const assistantContent = 'SUGGESTIONS:' + JSON.stringify(parsed);
			setMessages(prev => {
				const newMessages: Message[] = [...prev, { role: 'assistant', content: assistantContent }];
				setPendingSuggestions(p => ({ ...p, [newMessages.length - 1]: parsed }));
				return newMessages;
			});
			showToast('Sample suggestions loaded', 'info');
		} catch (e) {
			console.error('Failed to load sample suggestions', e);
			showToast('Failed to load sample suggestions', 'error');
		}
	};

	const handleApplyAllChanges = async () => {
		setApplyingChanges(true);
		
		try {
			// Collect all approved suggestions from messages (excluding pending ones)
			const allPendingSuggestions = Object.values(pendingSuggestions).flat();
			const finalSuggestions = messages
				.flatMap(m => m.suggestions || [])
				.filter(s => !allPendingSuggestions.some(p => 
					p.newText === s.newText && p.originalText === s.originalText && p.type === s.type
				));

			if (finalSuggestions.length === 0) {
				alert('No suggestions to apply. Please approve some suggestions first.');
				setApplyingChanges(false);
				return;
			}

			// Create a curated version of the resume with applied suggestions
			if (!resumeData) {
				alert('Resume data not available');
				setApplyingChanges(false);
				return;
			}

			// Clone the current resume data
			const curated: ResumeData = JSON.parse(JSON.stringify(resumeData));
			let updatedSummary = resume.summary || '';

			// Apply each suggestion to the curated resume
			finalSuggestions.forEach(suggestion => {
				if (suggestion.type === 'skill' && suggestion.action === 'add') {
					// Add skill if not already present
					if (!curated.skills.find(s => s.name.toLowerCase() === suggestion.newText.toLowerCase())) {
						curated.skills.push({ name: suggestion.newText });
					}
				} else if (suggestion.type === 'skill' && suggestion.action === 'remove') {
					// Remove skill
					curated.skills = curated.skills.filter(s => 
						s.name.toLowerCase() !== suggestion.originalText.toLowerCase()
					);
				} else if (suggestion.type === 'summary' && (suggestion.action === 'update' || suggestion.action === 'modify')) {
					// Update summary
					updatedSummary = suggestion.newText;
				} else if (suggestion.type === 'experience' && (suggestion.action === 'modify' || suggestion.action === 'update')) {
					applyExperienceSuggestionToCurated(curated, suggestion);
				}
			});

			// Update the curated resume state
			setCuratedResumeData(curated);
			setCuratedSummary(updatedSummary);

			// Clear all suggestions after applying
			setPendingSuggestions({});
			setMessages(prev => prev.map(m => ({ ...m, suggestions: undefined })));

			alert(`Successfully applied ${finalSuggestions.length} suggestions to your curated resume for export!`);

		} catch (error) {
			console.error('Apply changes error:', error);
			alert(error instanceof Error ? error.message : 'Failed to apply changes');
		} finally {
			setApplyingChanges(false);
		}
	};

	// Check if there are pending suggestions or approved suggestions in messages
	const hasAnySuggestions = Object.keys(pendingSuggestions).length > 0 || 
		messages.some(m => m.suggestions && m.suggestions.length > 0);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleExportToPDF = async () => {
		const resumeElement = document.querySelector('.resume-preview-bottom .resume-content') as HTMLElement;
		if (!resumeElement) {
			alert('No resume content available to export');
			return;
		}

		try {
			const html2pdf = (await import('html2pdf.js')).default;
			
			const displayData = curatedResumeData || resumeData;
			const fileName = displayData?.personalInfo?.fullName?.replace(/\s+/g, '_') || 'resume';
			
			const opt = {
				margin: [0.4, 0.5, 0.4, 0.5] as [number, number, number, number],
				filename: `${fileName}_curated.pdf`,
				image: { type: 'jpeg' as const, quality: 0.95 },
				html2canvas: { 
					scale: 2.5, 
					useCORS: true,
					letterRendering: true,
					scrollY: 0,
					scrollX: 0
				},
				jsPDF: { 
					unit: 'in' as const, 
					format: 'letter' as const, 
					orientation: 'portrait' as const,
					compress: true
				},
				pagebreak: { 
					mode: ['avoid-all', 'css', 'legacy'],
					before: '.page-break-before',
					after: '.page-break-after',
					avoid: ['h3', '.resume-section-title', '.exp-header', '.edu-header']
				}
			};

			html2pdf().set(opt).from(resumeElement).save();
		} catch (error) {
			console.error('Error exporting PDF:', error);
			alert('Failed to export PDF. Please try again.');
		}
	};

	return (
		<div className="curator-container">
			{!mode ? (
				<div className="mode-selection">
					<h2>What would you like help with?</h2>
					<div className="mode-pills">
						<button 
							className="mode-pill career-growth"
							onClick={() => handleModeSelect('career-growth')}
						>
							<div className="pill-icon">📈</div>
							<div className="pill-content">
								<h3>Career Growth Helper</h3>
								<p>Discover your strengths and areas to improve</p>
							</div>
						</button>
						<button 
							className="mode-pill job-match"
							onClick={() => handleModeSelect('job-match')}
						>
							<div className="pill-icon">🎯</div>
							<div className="pill-content">
								<h3>Job Description Match</h3>
								<p>Tailor your resume for specific jobs</p>
							</div>
						</button>
					</div>
				</div>
			) : (
				<div className="curator-workspace">
					{/* Header with Export Button */}
					<div className="workspace-header">
						<div className="header-left">
							<h2>
								{mode === 'career-growth' ? '📈 Career Growth Helper' : '🎯 Job Description Match'}
							</h2>
							<button className="back-btn" onClick={() => setMode(null)}>
								← Change Mode
							</button>
						</div>
						{mode === 'job-match' && (
							<button className="export-pdf-btn" onClick={handleExportToPDF}>
								📄 Export to PDF
							</button>
						)}
					</div>

					{/* Main Content Area */}
					<div className="workspace-content">
						{/* Left Side - Chat */}
						<div className="chat-section">
							<div className="messages-container">
								{messages.map((msg, idx) => (
									<div key={idx} className={`message ${msg.role}`}>
										<div 
											className="message-content"
											dangerouslySetInnerHTML={{ 
												__html: marked.parse(msg.content) as string
											}}
										/>
									</div>
								))}
								{loading && (
									<div className="message assistant">
										<div className="message-content">
											<div className="typing-indicator">
												<span></span>
												<span></span>
												<span></span>
											</div>
										</div>
									</div>
								)}
								<div ref={messagesEndRef} />
							</div>

							<div className="input-container">
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder={
										mode === 'career-growth' 
											? 'Ask about your strengths, skills to develop, or career advice...'
											: '📋 Paste the full job description here (title, requirements, qualifications, responsibilities)...'
									}
									rows={3}
									disabled={loading}
								/>
								<button 
									onClick={handleSendMessage} 
									disabled={!input.trim() || loading}
									className="send-btn"
								>
									{loading ? 'Sending...' : 'Send'}
								</button>
							</div>
						</div>

						{/* Right Side - Suggestions (only for job-match mode) */}
						{mode === 'job-match' && (
							<div className="suggestions-sidebar">
								<div className="suggestions-header">
									<h3>📝 Suggestions</h3>
									{hasAnySuggestions && (
										<button 
											className="apply-all-btn"
											onClick={handleApplyAllChanges}
											disabled={applyingChanges}
										>
											{applyingChanges ? 'Applying...' : '✓ Apply All'}
										</button>
									)}
									<button className="load-sample-btn" onClick={loadSampleSuggestions}>Load sample suggestions</button>
								</div>
								
								<div className="suggestions-list">
									{Object.keys(pendingSuggestions).length === 0 ? (
										<div className="no-suggestions">
											<p>� Suggestions will appear here when you chat about job descriptions</p>
										</div>
									) : (
										Object.entries(pendingSuggestions).map(([msgIdx, suggestions]) => (
											suggestions.map((suggestion, sIdx) => (
												<div key={`${msgIdx}-${sIdx}`} className="suggestion-card">
													<div className="suggestion-header">
														{suggestion.type === 'skill' && suggestion.action === 'add' && '➕ Add Skill'}
														{suggestion.type === 'skill' && suggestion.action === 'remove' && '➖ Remove Skill'}
														{suggestion.type === 'summary' && '✏️ Update Summary'}
														{suggestion.type === 'experience' && '📝 Enhance Experience'}
													</div>

													{/* Render pill with old and new values (prefer snake_case aliases) */}
													<div style={{marginBottom: '0.5rem'}}>
														<span className="suggestion-pill">
															{(suggestion.old_text ?? suggestion.originalText) ? (
																<span className="pill-old">{(suggestion.old_text ?? suggestion.originalText)}</span>
															) : null}
															{(suggestion.new_text ?? suggestion.newText) ? (
																<span className="pill-new">{(suggestion.new_text ?? suggestion.newText)}</span>
															) : null}
														</span>
													</div>

													{/* Show reason */}
													{(suggestion.reason) && (
														<div className="suggestion-reason">💡 {suggestion.reason}</div>
													)}
													
													<div className="suggestion-reason">💡 {suggestion.reason}</div>
													<div className="suggestion-actions">
														<button 
															className="approve-btn"
															onClick={() => handleApproveSuggestion(Number(msgIdx), sIdx)}
														>
															✓ Accept
														</button>
														<button 
															className="reject-btn"
															onClick={() => handleRejectSuggestion(Number(msgIdx), sIdx)}
														>
															✗ Reject
														</button>
													</div>
												</div>
											))
										))
									)}
								</div>
							</div>
						)}
					</div>

					{/* Bottom - Resume Preview (only for job-match mode) */}
					{mode === 'job-match' && (
						<div className="resume-preview-bottom">
							<div className="preview-header">
								<h3>📄 Resume Preview {curatedResumeData && <span style={{fontSize: '0.9rem', fontWeight: 'normal'}}>(with applied suggestions)</span>}</h3>
							</div>
							
							{resumeData ? (
								<div className="resume-content">
									{/* Personal Info */}
									{(curatedResumeData || resumeData).personalInfo && (
										<div className="resume-section">
											<h1 className="resume-name">{(curatedResumeData || resumeData).personalInfo.fullName || 'No name'}</h1>
											<div className="resume-contact">
												{(curatedResumeData || resumeData).personalInfo.email && <span>{(curatedResumeData || resumeData).personalInfo.email}</span>}
												{(curatedResumeData || resumeData).personalInfo.phone && <span> • {(curatedResumeData || resumeData).personalInfo.phone}</span>}
												{(curatedResumeData || resumeData).personalInfo.location && <span> • {(curatedResumeData || resumeData).personalInfo.location}</span>}
											</div>
										</div>
									)}

									{/* Professional Summary */}
									{(curatedSummary || resume.summary) && (
										<div className="resume-section">
											<h3 className="resume-section-title">Professional Summary</h3>
											<p className="resume-summary">{curatedSummary || resume.summary}</p>
										</div>
									)}

									{/* Skills */}
									{(curatedResumeData || resumeData).skills && (curatedResumeData || resumeData).skills.length > 0 && (
										<div className="resume-section">
											<h3 className="resume-section-title">Skills</h3>
											<div className="resume-skills">
												{(curatedResumeData || resumeData).skills.map((skill, idx) => (
													<span key={idx} className="resume-skill-tag">{skill.name}</span>
												))}
											</div>
										</div>
									)}

									{/* Experience */}
									{(curatedResumeData || resumeData).experience && (curatedResumeData || resumeData).experience.length > 0 && (
										<div className="resume-section">
											<h3 className="resume-section-title">Experience</h3>
											{(curatedResumeData || resumeData).experience.map((exp, idx) => (
												<div key={idx} className="resume-experience-item">
													<div className="exp-header">
														<div>
															<strong className="exp-title">{exp.title}</strong>
															<span className="exp-company"> - {exp.company}</span>
															{exp.location && <span className="exp-location"> ({exp.location})</span>}
														</div>
														<div className="exp-date">{exp.startDate} - {exp.endDate}</div>
													</div>
													{exp.responsibilities && exp.responsibilities.length > 0 ? (
														<ul className="exp-responsibilities">
															{exp.responsibilities.map((resp, rIdx) => (
																<li key={rIdx}>{resp}</li>
															))}
														</ul>
													) : exp.description && (
														<div className="exp-description">{exp.description}</div>
													)}
												</div>
											))}
										</div>
									)}

									{/* Education */}
									{(curatedResumeData || resumeData).education && (curatedResumeData || resumeData).education.length > 0 && (
										<div className="resume-section">
											<h3 className="resume-section-title">Education</h3>
											{(curatedResumeData || resumeData).education.map((edu, idx) => (
												<div key={idx} className="resume-education-item">
													<div className="edu-header">
														<div>
															<strong className="edu-degree">{edu.degree}</strong>
															{edu.fieldOfStudy && <span> - {edu.fieldOfStudy}</span>}
															<div className="edu-institution">{edu.institution}</div>
															{edu.gpa && <div className="edu-gpa">GPA: {edu.gpa}</div>}
															{edu.honors && <div className="edu-honors">{edu.honors}</div>}
														</div>
														<div className="edu-date">{edu.startYear} - {edu.endYear}</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							) : (
								<div className="resume-loading">
									No resume data available. Please fill in your profile in the Profile tab.
								</div>
							)}

						{/* Toast */}
						{toast.visible && (
							<div className={`toast ${toast.type || 'info'}`} role="status" aria-live="polite">
								{toast.message}
							</div>
						)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
