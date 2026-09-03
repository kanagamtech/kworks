const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Models } = require(path.join(__dirname, '../backend/db/mongo'));

const uri = process.env.MONGODB_URI || 'mongodb://root:FWsp6zg1e1QGpzvIs3e8a5hICkxiik7ZkAPbXt7DqZ6E3pUbB0LxMUZF8PCAY4PZ@103.98.192.11:27017/default?authSource=admin&directConnection=true';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Find all attendance records on 2026-09-01 and 2026-09-02 that do not have punchOutTime
  const records = await Models.Attendance.find({
    date: { $in: ['2026-09-01', '2026-09-02'] }
  });

  console.log(`Total records on 01 and 02: ${records.length}`);

  let updatedCount = 0;
  for (const rec of records) {
    if (!rec.punchOutTime) {
      // Calculate realistic duration or standard 6:00 PM shift end
      let punchOutTime = '06:00:00 PM';
      let duration = '08h 30m';

      // If check-in time is available, e.g. 9:02 AM -> 06:02 PM
      if (rec.time) {
        const clean = rec.time.replace(/[^0-9:.]/g, ' ').trim().split(/[:.]/);
        const hrs = parseInt(clean[0], 10) || 9;
        const mins = parseInt(clean[1], 10) || 0;
        const outHrs = (hrs + 8) > 12 ? (hrs + 8 - 12) : (hrs + 8);
        punchOutTime = `06:${String(mins).padStart(2, '0')}:00 PM`;
        duration = `08h ${String(mins).padStart(2, '0')}m`;
      }

      rec.punchOutTime = punchOutTime;
      rec.duration = duration;
      await rec.save();
      updatedCount++;
    }
  }

  console.log(`Successfully closed ${updatedCount} past shifts for 2026-09-01 and 2026-09-02!`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(console.error);
