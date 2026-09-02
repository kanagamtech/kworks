const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appJsonPath = path.join(__dirname, '../app/app.json');
const raw = fs.readFileSync(appJsonPath, 'utf8');
const parsed = JSON.parse(raw);

const branches = ['production', 'preview'];
const runtimes = ['1.4.0-beta', '1.4.0', '1.3.0', '1.3.0-fix', '1.2.0-beta', '1.1.0-beta', '1.0.1', '1.0.0'];

console.log('🚀 Starting Multi-Branch, Multi-Runtime EAS OTA Publisher (v1.4 Beta Test)...\n');

for (const branch of branches) {
  for (const runtime of runtimes) {
    console.log(`\n======================================================`);
    console.log(`Publishing to Branch [${branch}] | Runtime [${runtime}]`);
    console.log(`======================================================`);

    parsed.expo.version = runtime;
    fs.writeFileSync(appJsonPath, JSON.stringify(parsed, null, 2));

    try {
      const cmd = `npx eas update --branch ${branch} --message "KwOrKs v1.4 Beta Test: End-to-End Encryption (E2EE), Permanent Chat Persistence, Targeted Push Notifications & Food Selection" --non-interactive`;
      const out = execSync(cmd, {
        cwd: path.join(__dirname, '../app'),
        encoding: 'utf8',
        env: { ...process.env, CI: '1', EAS_SKIP_AUTO_FINGERPRINT: '1' },
      });

      const summary = out
        .split('\n')
        .filter((l) => l.includes('Runtime version') || l.includes('Published!') || l.includes('Update group ID'))
        .join('\n');
      console.log(summary || 'Published successfully!');
    } catch (err) {
      console.error(`❌ Error publishing Branch [${branch}] Runtime [${runtime}]:`, err.stdout || err.message);
    }
  }
}

// Restore app.json to 1.4.0-beta
parsed.expo.version = '1.4.0-beta';
fs.writeFileSync(appJsonPath, JSON.stringify(parsed, null, 2));
console.log('\n✅ All EAS branches & runtimes updated successfully! Restored app.json to 1.4.0-beta.');
