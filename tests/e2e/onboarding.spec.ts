import { test, expect } from '@playwright/test'

test('public pages render', async ({ page }) => {
  await page.goto('/(public)/login')
  await expect(page.getByText('Logowanie')).toBeVisible()
})
