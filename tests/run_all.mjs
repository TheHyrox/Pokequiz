import { spawn } from 'node:child_process';
import { BASE_URL, CDP_URL, sleep } from './cdp_helpers.mjs';
import { runScreenMatrixTests } from './test_screens.mjs';
import { runDescriptionQuizTests } from './test_quiz_description.mjs';
import { runInformationQuizTests } from './test_quiz_information.mjs';
import { runSpritesQuizTests } from './test_quiz_sprites.mjs';
import { runZoomQuizTests } from './test_quiz_zoom.mjs';
import { runShinyQuizTests } from './test_quiz_shiny.mjs';
import { runPokedleQuizTests } from './test_quiz_pokedle.mjs';
import { runNumberQuizTests } from './test_quiz_number.mjs';
import { runSudokuQuizTests } from './test_quiz_sudoku.mjs';
import { runNewFunctionalityTests } from './test_new_features.mjs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function ensureServer() {
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.ok) return null;
    } catch {}

    const proc = spawn('node', ['server/dist/server/src/index.js'], {
        stdio: 'ignore'
    });

    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch(`${BASE_URL}/api/health`);
            if (res.ok) return proc;
        } catch {}
        await sleep(200);
    }
    proc.kill();
    throw new Error(`Failed to start server at ${BASE_URL}`);
}

async function ensureChrome() {
    try {
        const res = await fetch(`${CDP_URL}/json/version`);
        if (res.ok) return null;
    } catch {}

    const proc = spawn(CHROME_PATH, [
        '--headless=new',
        '--remote-debugging-port=9222',
        '--user-data-dir=/tmp/chrome-pokequiz-tests',
        '--no-first-run',
        '--no-default-browser-check',
        'about:blank'
    ], { stdio: 'ignore' });

    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch(`${CDP_URL}/json/version`);
            if (res.ok) return proc;
        } catch {}
        await sleep(200);
    }
    proc.kill();
    throw new Error('Failed to start headless Chrome CDP on port 9222');
}

async function main() {
    const serverProc = await ensureServer();
    const chromeProc = await ensureChrome();
    const summaries = [];

    try {
        const allSuites = [
            runScreenMatrixTests,
            runDescriptionQuizTests,
            runInformationQuizTests,
            runSpritesQuizTests,
            runZoomQuizTests,
            runShinyQuizTests,
            runPokedleQuizTests,
            runNumberQuizTests,
            runSudokuQuizTests,
            runNewFunctionalityTests
        ];
        const filter = process.env.TEST_SUITE?.toLowerCase();
        const suites = filter
            ? allSuites.filter(s => s.name.toLowerCase().includes(filter))
            : allSuites;

        for (const runSuite of suites) {
            console.log(`\n=== Running ${runSuite.name} ===`);
            summaries.push(await runSuite());
        }
    } finally {
        if (chromeProc) chromeProc.kill();
        if (serverProc) serverProc.kill();
    }

    console.log('\n================ TEST SUMMARY ================');
    let totalPassed = 0;
    let totalFailed = 0;
    for (const s of summaries) {
        totalPassed += s.passed;
        totalFailed += s.failed;
        console.log(`${s.failed === 0 ? '✓' : '✗'} ${s.suiteName}: ${s.passed}/${s.total} passed`);
    }
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
