import * as m from '$lib/paraglide/messages';

export interface CompressionPreset {
	id: string;
	name: () => string;
	quality: number;
	size_ratio: number;
	description: () => string;
}

export const DEFAULT_PRESETS: CompressionPreset[] = [
	{
		id: 'web-optimized',
		name: () => m.preset_web_optimized_name(),
		quality: 85,
		size_ratio: 0.8,
		description: () => m.preset_web_optimized_desc()
	},
	{
		id: 'social-media',
		name: () => m.preset_social_media_name(),
		quality: 80,
		size_ratio: 0.7,
		description: () => m.preset_social_media_desc()
	},
	{
		id: 'print-quality',
		name: () => m.preset_print_quality_name(),
		quality: 95,
		size_ratio: 1.0,
		description: () => m.preset_print_quality_desc()
	},
	{
		id: 'maximum-compression',
		name: () => m.preset_maximum_compression_name(),
		quality: 60,
		size_ratio: 0.5,
		description: () => m.preset_maximum_compression_desc()
	},
	{
		id: 'custom',
		name: () => m.preset_custom_name(),
		quality: 85,
		size_ratio: 0.8,
		description: () => m.preset_custom_desc()
	}
];
