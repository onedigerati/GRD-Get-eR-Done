#!/usr/bin/env node
/**
 * Verify CHANGELOG.md has an entry for the current package version.
 * Runs as part of prepublishOnly to prevent releasing without changelog.
 */

const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');

const version = pkg.version;
const pattern = `## [${version}]`;

if (!changelog.includes(pattern)) {
  console.error(`\n  ERROR: CHANGELOG.md has no entry for version ${version}\n`);
  console.error(`  Add a "## [${version}] - YYYY-MM-DD" section before publishing.\n`);
  process.exit(1);
}

console.log(`Changelog: v${version} entry found.`);
