<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to dashboard on mount
		goto('/dashboard');
	});
</script>

<div class="flex h-screen items-center justify-center">
	<p class="text-muted-foreground">Redirecting to dashboard...</p>
</div>
