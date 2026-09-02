const { execSync } = require('child_process');

const commits = execSync('git rev-list --max-count=30 HEAD -- backend/db/kworks_db.json')
  .toString('utf8')
  .trim()
  .split(/\r?\n/);

console.log('Found ' + commits.length + ' commits modifying kworks_db.json:');

for (const hash of commits) {
  if (!hash) continue;
  try {
    const subject = execSync(`git log -1 --format="%s" ${hash}`).toString('utf8').trim();
    const date = execSync(`git log -1 --format="%cd" --date=short ${hash}`).toString('utf8').trim();
    const raw = execSync(`git show ${hash}:backend/db/kworks_db.json`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const data = JSON.parse(raw);
    const count = data.attendance ? data.attendance.length : 0;
    const dateCounts = {};
    if (data.attendance) {
      data.attendance.forEach((a) => {
        dateCounts[a.date] = (dateCounts[a.date] || 0) + 1;
      });
    }
    console.log(`${hash.slice(0, 7)} | ${date} | Total: ${count} | Dates: ${JSON.stringify(dateCounts)} | ${subject}`);
  } catch (e) {
    console.log(`${hash.slice(0, 7)} Error: ${e.message}`);
  }
}
