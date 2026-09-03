const fs = require('fs');
const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Models } = require(path.join(__dirname, '../backend/db/mongo'));

const uri = process.env.MONGODB_URI || process.argv[2];

if (!uri) {
  console.error('ERROR: No MONGODB_URI provided. Usage: node scripts/migrate-to-mongo.js "<MONGODB_URI>"');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../backend/db/kworks_db.json');
if (!fs.existsSync(dbPath)) {
  console.error('ERROR: Database file not found at:', dbPath);
  process.exit(1);
}

const localData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function run() {
  console.log('Connecting to MongoDB at:', uri.replace(/:[^:@]+@/, ':****@'));
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB successfully!\n');

    // 1. Migrate Employees
    if (localData.employees && localData.employees.length > 0) {
      console.log(`Migrating ${localData.employees.length} employees...`);
      for (const emp of localData.employees) {
        if (emp.email) {
          await Models.Employee.findOneAndUpdate(
            { email: emp.email.toLowerCase() },
            { ...emp, email: emp.email.toLowerCase() },
            { upsert: true }
          );
        }
      }
      console.log('Employees migrated.');
    }

    // 2. Migrate Attendance
    if (localData.attendance && localData.attendance.length > 0) {
      console.log(`Migrating ${localData.attendance.length} attendance records (including 31 today records)...`);
      for (const att of localData.attendance) {
        if (att.date && att.user) {
          await Models.Attendance.findOneAndUpdate(
            { date: att.date, user: att.user.toLowerCase() },
            { ...att, user: att.user.toLowerCase() },
            { upsert: true }
          );
        }
      }
      console.log('Attendance records migrated.');
    }

    // 3. Migrate Food Counts
    if (localData.food_counts && localData.food_counts.length > 0) {
      console.log(`Migrating ${localData.food_counts.length} food count records...`);
      for (const fc of localData.food_counts) {
        if (fc.date && fc.user) {
          await Models.FoodCount.findOneAndUpdate(
            { date: fc.date, user: fc.user.toLowerCase() },
            { ...fc, user: fc.user.toLowerCase() },
            { upsert: true }
          );
        }
      }
      console.log('Food counts migrated.');
    }

    // 4. Migrate Notices
    if (localData.notices && localData.notices.length > 0) {
      console.log(`Migrating ${localData.notices.length} notices...`);
      for (const notice of localData.notices) {
        if (notice.id) {
          await Models.Notice.findOneAndUpdate(
            { id: notice.id },
            notice,
            { upsert: true }
          );
        }
      }
      console.log('Notices migrated.');
    }

    // Verification
    console.log('\n--- VERIFICATION OF MONGODB COLLECTIONS ---');
    const empCount = await Models.Employee.countDocuments();
    const attCount = await Models.Attendance.countDocuments();
    const fcCount = await Models.FoodCount.countDocuments();
    const noticeCount = await Models.Notice.countDocuments();

    console.log(`Employees in Mongo: ${empCount}`);
    console.log(`Attendance in Mongo: ${attCount}`);
    console.log(`Food Counts in Mongo: ${fcCount}`);
    console.log(`Notices in Mongo: ${noticeCount}`);

    console.log('\nSUCCESS: All data from local DB has been migrated into MongoDB!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
