#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function run(command, args, capture = false) {
  return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
}
if (process.platform !== 'darwin') throw new Error('Signed releases must be built on macOS.');
const identity = process.env.WORDNOOK_SIGN_IDENTITY;
const profile = process.env.WORDNOOK_NOTARY_PROFILE;
if (!identity?.startsWith('Developer ID Application:') || !profile) {
  throw new Error('Set WORDNOOK_SIGN_IDENTITY to your Developer ID Application identity and WORDNOOK_NOTARY_PROFILE to an existing notarytool Keychain profile. Do not put credentials in source files.');
}
run('xcrun', ['--find', 'notarytool'], true);
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const temp = mkdtempSync(join(tmpdir(), 'wordnook-sign-'));
const output = resolve(root, 'release-signed', pkg.version + '-' + Date.now());
mkdirSync(output, { recursive: true });
const config = structuredClone(pkg.build);
config.extends = null;
config.forceCodeSigning = true;
config.directories = { ...config.directories, output };
config.mac = { ...config.mac, identity, hardenedRuntime: true, notarize: false };
const configPath = join(temp, 'builder.json');
writeFileSync(configPath, JSON.stringify(config, null, 2));
try {
  run('npm', ['test']);
  run('npm', ['run', 'build']);
  run('npx', ['--no-install', 'electron-builder', '--config', configPath, '--mac', '--dir', '--arm64', '--x64', '--publish', 'never']);
  for (const [directory, label] of [['mac-arm64', 'AppleSilicon'], ['mac', 'Intel']]) {
    const app = join(output, directory, 'Wordnook.app');
    run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
    const upload = join(temp, label + '-submission.zip');
    run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, upload]);
    const response = JSON.parse(run('xcrun', ['notarytool', 'submit', upload, '--keychain-profile', profile, '--wait', '--output-format', 'json'], true));
    if (response.status !== 'Accepted') {
      throw new Error('Apple notarization did not accept ' + label + '. Submission: ' + response.id + ', status: ' + response.status);
    }
    run('xcrun', ['stapler', 'staple', app]);
    run('xcrun', ['stapler', 'validate', app]);
    run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
    run('spctl', ['--assess', '--type', 'execute', '--verbose=4', app]);
    const archive = join(output, 'Wordnook-' + label + '.zip');
    run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, archive]);
  }
  writeFileSync(join(output, 'VERIFIED.txt'), 'Both architectures passed codesign, Apple notarization, stapler and Gatekeeper assessment.\nMac launch and feature testing are still required before publication.\n');
  console.log('Verified signed packages: ' + output);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
