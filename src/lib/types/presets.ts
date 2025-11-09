export interface CompressionPreset {
	id: string;
	name: string;
	quality: number;
	size_ratio: number;
	description: string;
}

export const DEFAULT_PRESETS: CompressionPreset[] = [
	{
		id: 'web-optimized',
		name: 'Web Optimized',
		quality: 85,
		size_ratio: 0.8,
		description: 'Balanced quality and file size for web use'
	},
	{
		id: 'social-media',
		name: 'Social Media',
		quality: 80,
		size_ratio: 0.7,
		description: 'Optimized for social media platforms'
	},
	{
		id: 'print-quality',
		name: 'Print Quality',
		quality: 95,
		size_ratio: 1.0,
		description: 'High quality for printing, minimal compression'
	},
	{
		id: 'maximum-compression',
		name: 'Maximum Compression',
		quality: 60,
		size_ratio: 0.5,
		description: 'Smallest file size, may show artifacts'
	},
	{
		id: 'custom',
		name: 'Custom',
		quality: 85,
		size_ratio: 0.8,
		description: 'Manually adjust settings'
	}
];
