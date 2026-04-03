const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

// Read the theme-toggle.js source code
const jsCode = fs.readFileSync(path.join(__dirname, '../theme/unfold-base/login/resources/js/theme-toggle.js'), 'utf-8');

// A helper to setup the DOM environment and execute the theme-toggle script
function setupDOM(htmlContent = '') {
    const dom = new JSDOM(htmlContent, {
        runScripts: 'dangerously',
        url: 'http://localhost'
    });

    // Mock matchMedia
    dom.window.matchMedia = () => ({ matches: false, addEventListener: () => {} });

    // Evaluate the script within the DOM context
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = jsCode;
    dom.window.document.head.appendChild(scriptEl);

    return dom.window;
}

test('theme-toggle.js tests', async (t) => {

    await t.test('applyTheme adds dark mode classes when isDark is true', () => {
        const window = setupDOM();

        // Ensure no dark mode classes exist
        assert.strictEqual(window.document.documentElement.classList.contains('pf-v5-theme-dark'), false);
        assert.strictEqual(window.document.documentElement.classList.contains('dark'), false);

        // Call applyTheme directly from the window context
        window.applyTheme(true);

        assert.strictEqual(window.document.documentElement.classList.contains('pf-v5-theme-dark'), true);
        assert.strictEqual(window.document.documentElement.classList.contains('dark'), true);
    });

    await t.test('applyTheme removes dark mode classes when isDark is false', () => {
        const window = setupDOM();

        // Setup initial state with dark mode classes
        window.document.documentElement.classList.add('pf-v5-theme-dark', 'dark');

        // Call applyTheme
        window.applyTheme(false);

        assert.strictEqual(window.document.documentElement.classList.contains('pf-v5-theme-dark'), false);
        assert.strictEqual(window.document.documentElement.classList.contains('dark'), false);
    });

    await t.test('applyTheme toggles hidden class on sun and moon icons correctly', () => {
        const htmlContent = `
            <div id="theme-toggle-sun"></div>
            <div id="theme-toggle-moon"></div>
        `;
        const window = setupDOM(htmlContent);
        const sunIcon = window.document.getElementById('theme-toggle-sun');
        const moonIcon = window.document.getElementById('theme-toggle-moon');

        // Test dark mode
        window.applyTheme(true);
        assert.strictEqual(sunIcon.classList.contains('hidden'), false);
        assert.strictEqual(moonIcon.classList.contains('hidden'), true);

        // Test light mode
        window.applyTheme(false);
        assert.strictEqual(sunIcon.classList.contains('hidden'), true);
        assert.strictEqual(moonIcon.classList.contains('hidden'), false);
    });

    await t.test('applyTheme handles missing icons gracefully without errors', () => {
        const window = setupDOM(); // No icons in HTML

        // Should not throw
        try {
            window.applyTheme(true);
            window.applyTheme(false);
            assert.ok(true); // Reached here, so no error was thrown
        } catch (e) {
            assert.fail('applyTheme threw an error when icons were missing: ' + e.message);
        }
    });

});
