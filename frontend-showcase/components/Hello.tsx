type HelloProps = {
	name?: string;
};

export function Hello({ name = 'React' }: HelloProps) {
	return (
		<div>
			<h1>Welcome to {name} + Vite</h1>
			<p>Start building in src/App.tsx</p>
		</div>
	);
}


