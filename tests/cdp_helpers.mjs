import assert from 'node:assert/strict';

export const BASE_URL = process.env.POKEQUIZ_URL || 'http://localhost:3000';
export const CDP_URL = process.env.CDP_URL || 'http://localhost:9222';

export const DESKTOP_VIEWPORTS = [
    // Standard 16:9 Desktop
    { id: '1080p', name: 'Standard 1080p (1920x1080)', width: 1920, height: 1080, deviceScaleFactor: 1 },
    { id: '1440p', name: 'Standard 1440p (2560x1440)', width: 2560, height: 1440, deviceScaleFactor: 1 },
    { id: '2160p', name: 'Standard 4K 2160p (3840x2160)', width: 3840, height: 2160, deviceScaleFactor: 1 },
    // Ultra-Wide 21:9 & Super Ultra-Wide 32:9
    { id: 'uw-1080p', name: 'Ultra-Wide 1080p (2560x1080)', width: 2560, height: 1080, deviceScaleFactor: 1 },
    { id: 'uw-1440p', name: 'Ultra-Wide 1440p (3440x1440)', width: 3440, height: 1440, deviceScaleFactor: 1 },
    { id: 'uw-2160p', name: 'Ultra-Wide 5K2K (5120x2160)', width: 5120, height: 2160, deviceScaleFactor: 1 },
    { id: 'suw-1080p', name: 'Super Ultra-Wide 1080p (3840x1080)', width: 3840, height: 1080, deviceScaleFactor: 1 },
    { id: 'suw-1440p', name: 'Super Ultra-Wide 1440p (5120x1440)', width: 5120, height: 1440, deviceScaleFactor: 1 },
    // macOS Scaled / Retina
    { id: 'mac-1440x900', name: 'macOS (1440x900@2x)', width: 1440, height: 900, deviceScaleFactor: 2 },
    { id: 'mac-1470x956', name: 'macOS (1470x956@2x)', width: 1470, height: 956, deviceScaleFactor: 2 },
    { id: 'mac-1710x1068', name: 'macOS (1710x1068@2x)', width: 1710, height: 1068, deviceScaleFactor: 2 },
    { id: 'mac-1710x1112', name: 'macOS (1710x1112@2x)', width: 1710, height: 1112, deviceScaleFactor: 2 },
    { id: 'mac-1920x1200', name: 'macOS (1920x1200@2x)', width: 1920, height: 1200, deviceScaleFactor: 2 },
    { id: 'mac-2048x1280', name: 'macOS (2048x1280@2x)', width: 2048, height: 1280, deviceScaleFactor: 2 },
    { id: 'mac-2048x1332', name: 'macOS (2048x1332@2x)', width: 2048, height: 1332, deviceScaleFactor: 2 },
    { id: 'mac-2560x1440', name: 'macOS (2560x1440@2x)', width: 2560, height: 1440, deviceScaleFactor: 2 },
    { id: 'mac-2560x1600', name: 'macOS (2560x1600@2x)', width: 2560, height: 1600, deviceScaleFactor: 2 }
];

export const MOBILE_VIEWPORTS = [
    // Compact & Standard Smartphones (Portrait)
    { id: 'iphone-se', name: 'iPhone SE (375x667@2x)', width: 375, height: 667, deviceScaleFactor: 2, mobile: true },
    { id: 'iphone-14', name: 'iPhone 14 / 15 (390x844@3x)', width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
    { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max (430x932@3x)', width: 430, height: 932, deviceScaleFactor: 3, mobile: true },
    { id: 'galaxy-s23', name: 'Samsung Galaxy S23 (360x780@3x)', width: 360, height: 780, deviceScaleFactor: 3, mobile: true },
    { id: 'pixel-7', name: 'Google Pixel 7 (412x915@2.625x)', width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true },
    { id: 'small-mobile', name: 'Compact Mobile (320x568@2x)', width: 320, height: 568, deviceScaleFactor: 2, mobile: true },
    // Mobile Landscape & Tablet
    { id: 'mobile-landscape', name: 'Mobile Landscape (667x375@2x)', width: 667, height: 375, deviceScaleFactor: 2, mobile: true },
    { id: 'ipad-mini', name: 'iPad Mini Portrait (768x1024@2x)', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true }
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.nextId = 1;
        this.pending = new Map();
        this.listeners = new Map();
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve);
            this.ws.addEventListener('error', reject);
        });
        this.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(JSON.stringify(msg.error)));
                else resolve(msg.result);
            } else if (msg.method) {
                for (const h of this.listeners.get(msg.method) || []) h(msg.params);
            }
        });
    }

    send(method, params = {}) {
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    on(method, handler) {
        if (!this.listeners.has(method)) this.listeners.set(method, []);
        this.listeners.get(method).push(handler);
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

export async function createPage() {
    const res = await fetch(`${CDP_URL}/json/new?about:blank`, { method: 'PUT' });
    const target = await res.json();
    const cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    const networkErrors = [];
    const consoleErrors = [];
    const runtimeExceptions = [];

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    // Read-only fetch spy so tests can inspect API payloads without altering app behavior
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `(() => {
            window.__apiLog = [];
            const origFetch = window.fetch.bind(window);
            window.fetch = async (...args) => {
                const res = await origFetch(...args);
                try {
                    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                    if (url.includes('/api/')) {
                        const clone = res.clone();
                        clone.json().then(data => {
                            window.__apiLog.push({ url, status: res.status, data });
                        }).catch(() => {});
                    }
                } catch {}
                return res;
            };
        })();`
    });

    cdp.on('Network.responseReceived', (p) => {
        if (p.response.status >= 400) {
            networkErrors.push({ url: p.response.url, status: p.response.status });
        }
    });
    cdp.on('Runtime.consoleAPICalled', (p) => {
        if (p.type === 'error') {
            const text = p.args.map((a) => a.value ?? a.description ?? '').join(' ');
            consoleErrors.push(text);
        }
    });
    cdp.on('Runtime.exceptionThrown', (p) => {
        runtimeExceptions.push(p.exceptionDetails?.text || 'Runtime exception');
    });

    await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
    return {
        cdp,
        networkErrors,
        consoleErrors,
        runtimeExceptions,
        async close() {
            cdp.close();
            await fetch(`${CDP_URL}/json/close/${target.id}`).catch(() => {});
        }
    };
}

export async function setViewport(cdp, vp) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor ?? 1,
        mobile: Boolean(vp.mobile)
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', {
        enabled: Boolean(vp.mobile)
    });
}

export async function evalJS(cdp, expression) {
    const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (res.exceptionDetails) {
        throw new Error('JS Eval Exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
}

export async function waitFor(cdp, fnExpr, timeoutMs = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ok = await evalJS(cdp, `Boolean(${fnExpr})`);
        if (ok) return true;
        await sleep(100);
    }
    throw new Error(`Timeout waiting for: ${fnExpr}`);
}

export async function navigateHome(cdp) {
    await cdp.send('Page.navigate', { url: BASE_URL });
    await waitFor(cdp, `document.querySelectorAll('.game-card').length >= 5`);
    await sleep(150);
}

export async function openGameSettings(cdp, matchText) {
    await navigateHome(cdp);
    await evalJS(cdp, `localStorage.clear()`);
    await evalJS(cdp, `(() => {
        const card = Array.from(document.querySelectorAll('.game-card')).find(c => c.textContent.includes(${JSON.stringify(matchText)}));
        if (!card) throw new Error('Game card not found: ' + ${JSON.stringify(matchText)});
        card.click();
    })()`);
    await waitFor(cdp, `document.querySelector('.settings-container')`);
    await sleep(150);
}

export async function checkDesktopLayout(cdp, label) {
    const metrics = await evalJS(cdp, `(() => {
        const doc = document.documentElement;
        const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.offsetParent !== null);
        const brokenImgs = imgs.filter(i => i.src && (!i.complete || i.naturalWidth === 0)).map(i => i.src);
        return {
            innerWidth: window.innerWidth,
            scrollWidth: doc.scrollWidth,
            hasOverflow: doc.scrollWidth > window.innerWidth,
            brokenImgs
        };
    })()`);
    assert.equal(metrics.hasOverflow, false, `[${label}] Horizontal overflow: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
    assert.deepEqual(metrics.brokenImgs, [], `[${label}] Broken images found`);
}

export async function getPokemonNameById(cdp, id) {
    return await evalJS(cdp, `(async () => {
        if (!window.__namesMap) {
            const res = await fetch('/api/pokemon/names/9');
            const list = await res.json();
            window.__namesMap = new Map(list.map(p => [p.id, p.name]));
        }
        return window.__namesMap.get(${id}) || null;
    })()`);
}

export class TestRunner {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.results = [];
    }

    async test(ids, description, fn) {
        try {
            await fn();
            this.results.push({ ids, description, ok: true });
            console.log(`  ✓ [${ids}] ${description}`);
        } catch (err) {
            this.results.push({ ids, description, ok: false, error: err?.message || String(err) });
            console.error(`  ✗ [${ids}] ${description}\n    -> ${err?.message || err}`);
        }
    }

    summary() {
        const passed = this.results.filter((r) => r.ok).length;
        const failed = this.results.length - passed;
        return { suiteName: this.suiteName, total: this.results.length, passed, failed, results: this.results };
    }
}
