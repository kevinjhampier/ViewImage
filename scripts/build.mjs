import {
    cpSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'dist');
const sharedDirectories = ['_locales', 'css', 'html', 'icon', 'img', 'js'];

function readJSON(relativePath) {
    return JSON.parse(readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

function buildTarget(target, platformManifestPath) {
    const destination = path.join(outputRoot, target);
    const baseManifest = readJSON('manifest.base.json');
    const platformManifest = readJSON(platformManifestPath);
    const manifest = {
        ...baseManifest,
        ...platformManifest,
        background: {
            ...(baseManifest.background || {}),
            ...(platformManifest.background || {}),
        },
    };

    mkdirSync(destination, { recursive: true });
    for (const directory of sharedDirectories) {
        cpSync(path.join(projectRoot, directory), path.join(destination, directory), {
            recursive: true,
        });
    }

    writeFileSync(
        path.join(destination, 'manifest.json'),
        `${JSON.stringify(manifest, null, 4)}\n`,
        'utf8',
    );
}

rmSync(outputRoot, { force: true, recursive: true });
buildTarget('firefox', 'manifest.gecko.json');
buildTarget('chromium', 'manifest.blink.json');

console.log(`Built Firefox and Chromium extensions in ${outputRoot}`);
