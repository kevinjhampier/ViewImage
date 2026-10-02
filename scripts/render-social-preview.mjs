import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(modulePath);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function render() {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
        await page.goto(pathToFileURL(path.join(root, 'docs/assets/social-preview.html')).href);
        await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(image => image.decode()));
        });
        const output = path.join(root, 'docs/assets/social-preview.png');
        await page.screenshot({ path: output, type: 'png' });
        console.log(`Rendered HTML sharing card: ${output}`);
    } finally {
        await browser.close();
    }
}

render().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
