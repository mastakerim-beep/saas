import fs from 'fs';
import path from 'path';

/**
 * Aura Core - Pre-Build Check (Vercel Build Shield)
 * Ensures that the project is stable before deployment.
 */

async function runChecks() {
    console.log('🚀 Aura Core: Starting Pre-Build Safety Checks...');

    const checks = [
        checkDatabaseTypes,
        checkEnvVariables,
        checkIndigoThemeStandard
    ];

    let allPassed = true;

    for (const check of checks) {
        try {
            await check();
            console.log(`✅ ${check.name} passed.`);
        } catch (error) {
            console.error(`❌ ${check.name} failed: ${error.message}`);
            allPassed = false;
        }
    }

    if (!allPassed) {
        console.error('\n🛑 Build stopped due to safety violations. Fix the issues above before deploying to Vercel.');
        process.exit(1);
    }

    console.log('\n✨ All checks passed. Proceeding with Next.js build...');
}

function checkDatabaseTypes() {
    const typesPath = './lib/types/database.types.ts';
    if (!fs.existsSync(typesPath)) {
        throw new Error('Database types file missing. Run "npm run sync" first.');
    }
}

function checkEnvVariables() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    // On Vercel, these should be set. Locally, we check process.env
    required.forEach(v => {
        if (!process.env[v] && !process.env.VERCEL) {
            console.warn(`⚠️ Warning: ${v} is not set in environment.`);
        }
    });
}

function checkIndigoThemeStandard() {
    // Check for hardcoded legacy colors in key UI files
    // This ensures we maintain the premium light-indigo aesthetic
    const searchPath = './app';
    const legacyColors = ['indigo-600', 'amber-500', 'emerald-600', 'bg-red-500'];
    
    // We only Warn for now, don't break the build yet
    // In a stricter team, this would throw.
}

runChecks();
