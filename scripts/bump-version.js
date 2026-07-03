import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const manifestJsonPath = path.join(__dirname, '../manifest.json');

function bumpVersionString(versionStr) {
  const parts = versionStr.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${versionStr}`);
  }
  parts[2] += 1; // 패치 버전 1 증가
  return parts.join('.');
}

try {
  // 1. package.json 업데이트
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json file not found.');
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version;
  const newVersion = bumpVersionString(oldVersion);
  
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log(`package.json: ${oldVersion} -> ${newVersion}`);

  // 2. manifest.json 업데이트
  if (fs.existsSync(manifestJsonPath)) {
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    const oldManifestVer = manifestJson.version;
    manifestJson.version = newVersion;
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf8');
    console.log(`manifest.json: ${oldManifestVer} -> ${newVersion}`);
  } else {
    console.log('manifest.json not found, skipped manifest version bump.');
  }

  console.log(`Successfully bumped version to ${newVersion}`);
} catch (error) {
  console.error('Error bumping version:', error.message);
  process.exit(1);
}
