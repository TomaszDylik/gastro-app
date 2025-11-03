/**
 * ETAP 11: CI/CD i jakość kodu - Test Configuration
 *
 * Weryfikuje:
 * - GitHub Actions workflows (pr.yml, main.yml)
 * - Prettier configuration
 * - Format scripts w package.json
 * - CI/CD dokumentacja
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const rootDir = path.resolve(__dirname, '..')

describe('ETAP 11: CI/CD i jakość kodu', () => {
  describe('GitHub Actions Workflows', () => {
    it('should have PR workflow configured', () => {
      const prWorkflowPath = path.join(rootDir, '.github', 'workflows', 'pr.yml')
      expect(fs.existsSync(prWorkflowPath)).toBe(true)

      const content = fs.readFileSync(prWorkflowPath, 'utf-8')
      
      // Check workflow triggers
      expect(content).toContain('pull_request')
      expect(content).toContain('branches: [main]')
      
      // Check quality job steps
      expect(content).toContain('Install dependencies')
      expect(content).toContain('pnpm install --frozen-lockfile')
      expect(content).toContain('TypeScript type check')
      expect(content).toContain('pnpm tsc --noEmit')
      expect(content).toContain('Run tests')
      expect(content).toContain('pnpm test')
      expect(content).toContain('Build project')
      expect(content).toContain('pnpm build')
      
      // Check security audit
      expect(content).toContain('Security Audit')
      expect(content).toContain('pnpm audit')
    })

    it('should have main branch workflow configured', () => {
      const mainWorkflowPath = path.join(rootDir, '.github', 'workflows', 'main.yml')
      expect(fs.existsSync(mainWorkflowPath)).toBe(true)

      const content = fs.readFileSync(mainWorkflowPath, 'utf-8')
      
      // Check workflow triggers
      expect(content).toContain('push')
      expect(content).toContain('branches: [main]')
      
      // Check build steps
      expect(content).toContain('pnpm test')
      expect(content).toContain('pnpm build')
      
      // Check artifact upload
      expect(content).toContain('Upload build artifacts')
      expect(content).toContain('actions/upload-artifact')
      expect(content).toContain('.next')
    })
  })

  describe('Prettier Configuration', () => {
    it('should have .prettierrc configured', () => {
      const prettierrcPath = path.join(rootDir, '.prettierrc')
      expect(fs.existsSync(prettierrcPath)).toBe(true)

      const content = fs.readFileSync(prettierrcPath, 'utf-8')
      const config = JSON.parse(content)
      
      // Check key settings
      expect(config.semi).toBe(false)
      expect(config.singleQuote).toBe(true)
      expect(config.tabWidth).toBe(2)
      expect(config.printWidth).toBe(100)
      expect(config.plugins).toContain('prettier-plugin-tailwindcss')
    })

    it('should have .prettierignore configured', () => {
      const prettierignorePath = path.join(rootDir, '.prettierignore')
      expect(fs.existsSync(prettierignorePath)).toBe(true)

      const content = fs.readFileSync(prettierignorePath, 'utf-8')
      
      // Check ignored paths
      expect(content).toContain('node_modules')
      expect(content).toContain('.next')
      expect(content).toContain('pnpm-lock.yaml')
    })
  })

  describe('Package.json Scripts', () => {
    it('should have format scripts configured', () => {
      const packageJsonPath = path.join(rootDir, 'package.json')
      expect(fs.existsSync(packageJsonPath)).toBe(true)

      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      // Check format scripts
      expect(packageJson.scripts.format).toBe('prettier --write .')
      expect(packageJson.scripts['format:check']).toBe('prettier --check .')
    })

    it('should have prettier packages installed', () => {
      const packageJsonPath = path.join(rootDir, 'package.json')
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      // Check devDependencies
      expect(packageJson.devDependencies.prettier).toBeDefined()
      expect(packageJson.devDependencies['prettier-plugin-tailwindcss']).toBeDefined()
    })
  })

  describe('CI/CD Documentation', () => {
    it('should have CI/CD documentation', () => {
      const docsPath = path.join(rootDir, 'docs', 'CI_CD.md')
      expect(fs.existsSync(docsPath)).toBe(true)

      const content = fs.readFileSync(docsPath, 'utf-8')
      
      // Check documentation sections
      expect(content).toContain('# CI/CD Pipeline')
      expect(content).toContain('## Workflows')
      expect(content).toContain('## Local Development')
      expect(content).toContain('## Configuration Files')
      expect(content).toContain('## Required GitHub Secrets')
      
      // Check commands documented
      expect(content).toContain('pnpm lint')
      expect(content).toContain('pnpm format')
      expect(content).toContain('pnpm test')
      
      // Check secrets documented
      expect(content).toContain('DATABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })
  })

  describe('Workflow Environment Variables', () => {
    it('PR workflow should use required secrets', () => {
      const prWorkflowPath = path.join(rootDir, '.github', 'workflows', 'pr.yml')
      const content = fs.readFileSync(prWorkflowPath, 'utf-8')
      
      // Check environment variables in test step
      expect(content).toContain('DATABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(content).toContain('secrets.DATABASE_URL')
      expect(content).toContain('secrets.NEXT_PUBLIC_SUPABASE_URL')
      expect(content).toContain('secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })

    it('Main workflow should use required secrets', () => {
      const mainWorkflowPath = path.join(rootDir, '.github', 'workflows', 'main.yml')
      const content = fs.readFileSync(mainWorkflowPath, 'utf-8')
      
      // Check environment variables
      expect(content).toContain('DATABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })
  })

  describe('CI/CD Integration', () => {
    it('should be able to run format check', () => {
      const packageJsonPath = path.join(rootDir, 'package.json')
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      // Verify format:check script exists and would work
      expect(packageJson.scripts['format:check']).toBe('prettier --check .')
      
      // Verify prettier is installed
      expect(packageJson.devDependencies.prettier).toBeDefined()
    })

    it('should be able to run tests in CI', () => {
      const packageJsonPath = path.join(rootDir, 'package.json')
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      // Verify test script exists
      expect(packageJson.scripts.test).toBeDefined()
      
      // Verify vitest is available
      expect(packageJson.devDependencies.vitest).toBeDefined()
    })

    it('should be able to build in CI', () => {
      const packageJsonPath = path.join(rootDir, 'package.json')
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      // Verify build script exists
      expect(packageJson.scripts.build).toBe('next build')
    })
  })
})
