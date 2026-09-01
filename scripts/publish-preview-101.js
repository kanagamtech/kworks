const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appJsonPath = path.join(__dirname, '../app/app.json');
const raw = fs.readFileSync(appJsonPath, 'utf8');
const parsed = JSON.parse(raw);

parsed.expo.version = '1.0.1';
fs.writeFileSync(appJsonPath, JSON.stringify(parsed, null, 2));

try {
  console.log('Publishing branch [preview] runtime [1.0.1]...');
  execSync('npx eas-cli update --branch preview --message "v1.20-beta update" --non-interactive', {
    cwd: path.join(__dirname, '../app'),
    stdio: 'inherit'
  });
  console.log('✔ Successfully published to preview 1.0.1!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  parsed.expo.version = '1.2.0-beta';
  fs.writeFileSync(appJsonPath, JSON.stringify(parsed, null, 2));
  console.log('Restored app.json to 1.2.0-beta');
}
