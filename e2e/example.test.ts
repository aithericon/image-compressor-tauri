import { test, expect } from '@playwright/test';

test('app loads and displays dashboard', async ({ page }) => {
	await page.goto('/');

	// Should redirect to dashboard
	await expect(page).toHaveURL('/dashboard');

	// Should display the dashboard title
	await expect(page.getByRole('heading', { name: 'Welcome to Your App' })).toBeVisible();
});

test('can navigate to settings', async ({ page }) => {
	await page.goto('/');

	// Click on Settings in sidebar
	await page.getByTestId('nav-settings').click();

	// Should navigate to settings page
	await expect(page).toHaveURL('/settings');
	await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('theme toggle works', async ({ page }) => {
	await page.goto('/settings');

	// Get the current theme (should be dark by default)
	const html = page.locator('html');
	const initialTheme = await html.getAttribute('class');

	// Click light mode button
	await page.getByRole('button', { name: 'Sun' }).click();

	// Theme should change
	await expect(html).toHaveClass(/light/);

	// Click dark mode button
	await page.getByRole('button', { name: 'Moon' }).click();

	// Theme should change back
	await expect(html).toHaveClass(/dark/);
});
