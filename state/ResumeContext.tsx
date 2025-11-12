import React, { createContext, useContext, useMemo, useState } from 'react';

export type Education = {
	school: string;
	degree: string;
	field?: string;
	startYear?: string;
	endYear?: string;
	gpa?: string;
	honors?: string;
	location?: string;
};

export type Experience = {
	company: string;
	title: string;
	location?: string;
	startDate?: string;
	endDate?: string;
	description?: string;
	responsibilities?: string[];
};

export type Project = {
	name: string;
	description?: string;
	responsibilities?: string[];
	technologies?: string;
	link?: string;
	date?: string;
};

export type ResumeData = {
	fullName: string;
	email: string;
	phone?: string;
	location?: string;
	summary?: string;
	skills: string[];
	education: Education[];
	experience: Experience[];
	projects: Project[];
	links?: { label: string; url: string }[];
};

export type CuratedResume = {
	matchedSkills: string[];
	focusedSummary: string;
	experiences: Experience[];
};

type ResumeContextValue = {
	isAuthenticated: boolean;
	login: (username: string, password: string) => boolean; // deprecated: backend auth used instead
	setToken: (token: string) => void;
	logout: () => void;
	resume: ResumeData;
	setResume: (updater: (prev: ResumeData) => ResumeData) => void;
	curated?: CuratedResume;
	setCurated: (c: CuratedResume | undefined) => void;
};

const defaultResume: ResumeData = {
	fullName: '',
	email: '',
	phone: '',
	location: '',
	summary: '',
	skills: [],
	education: [],
	experience: [],
	projects: [],
	links: [],
};

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [resume, setResumeState] = useState<ResumeData>(defaultResume);
	const [curated, setCurated] = useState<CuratedResume | undefined>(undefined);

	const value = useMemo<ResumeContextValue>(
		() => ({
			isAuthenticated: Boolean(token),
			login: () => false, // local fallback removed
			setToken: (t: string) => {
				setToken(t);
			},
			logout: () => {
				setToken(null);
			},
			resume,
			setResume: (updater) => setResumeState((prev) => updater(prev)),
			curated,
			setCurated,
		}),
		[token, resume, curated],
	);

	return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
	const ctx = useContext(ResumeContext);
	if (!ctx) {
		throw new Error('useResume must be used within ResumeProvider');
	}
	return ctx;
}


