const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../backend/db/kworks_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const csvRows = [
  {
    name: 'naveenmugesh',
    email: 'naveenmugesh@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:02:28 AM',
    location: "Rajrajeswari College Of Engineering Boy's Hostel, Mysore Road, Bangalore Division, Kumbalgodu, Karnataka, 560074, India",
    gps: '12.886315° N, 77.448526° E (±27m)',
    lat: 12.886315,
    lon: 77.448526,
    acc: 27
  },
  {
    name: 'Ponhari',
    email: 'ponhari@quantummate.in',
    company: 'quantummate',
    date: '2026-09-02',
    time: '10:11:19 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Sabarees',
    email: 'sabarees@quantummate.in',
    company: 'quantummate',
    date: '2026-09-02',
    time: '9.00.00 AM',
    location: 'QuantumMate Office, Coimbatore',
    gps: '11.0168° N, 76.9558° E',
    lat: 11.0168,
    lon: 76.9558,
    acc: 5
  },
  {
    name: 'Sankar',
    email: 'sankar@quantummate.in',
    company: 'quantummate',
    date: '2026-09-02',
    time: '9.25.44 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Adith',
    email: 'adith@quantummate.in',
    company: 'quantummate',
    date: '2026-09-02',
    time: '9:45:58 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044163° N, 77.053927° E (±20m)',
    lat: 11.044163,
    lon: 77.053927,
    acc: 20
  },
  {
    name: 'Jona',
    email: 'jona@quantummate.in',
    company: 'quantummate',
    date: '2026-09-02',
    time: '9:26:23 am',
    location: '11.04416°, 77.05393°',
    gps: '11.044164° N, 77.053927° E (±20m)',
    lat: 11.044164,
    lon: 77.053927,
    acc: 20
  },
  {
    name: 'Abinesh.S',
    email: 'abinesh.s@emsstore.in',
    company: 'emsstore',
    date: '2026-09-02',
    time: '9.56.32 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.0289,
    lon: 77.0315,
    acc: 20
  },
  {
    name: 'Sudharson',
    email: 'sudharson@emsstore.in',
    company: 'emsstore',
    date: '2026-09-02',
    time: '9.45.18 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.0289,
    lon: 77.0315,
    acc: 20
  },
  {
    name: 'Jayashree',
    email: 'jayashree@emsstore.in',
    company: 'emsstore',
    date: '2026-09-02',
    time: '9:00:46 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.0289,
    lon: 77.0315,
    acc: 20
  },
  {
    name: 'Tamil Mukilan',
    email: 'tamilmukilan@emsstore.in',
    company: 'emsstore',
    date: '2026-09-02',
    time: '9:58:18 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Thenmozhi',
    email: 'thenmozhi@amsems.in',
    company: 'amsems',
    date: '2026-09-02',
    time: '9.14.11 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Sivakumar',
    email: 'sivakumar@amsems.in',
    company: 'amsems',
    date: '2026-09-02',
    time: '9.35.58 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Sasikala',
    email: 'sasikala@amsems.in',
    company: 'amsems',
    date: '2026-09-02',
    time: '9:25:24 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.0352,
    lon: 77.0421,
    acc: 20
  },
  {
    name: 'Kalaiselvi',
    email: 'kalaiselvi@amsems.in',
    company: 'amsems',
    date: '2026-09-02',
    time: '9.14.45 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Arulpriya',
    email: 'arulpriya@amsems.in',
    company: 'amsems',
    date: '2026-09-02',
    time: '9.40.53 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.0352,
    lon: 77.0421,
    acc: 20
  },
  {
    name: 'Harshsharma',
    email: 'harshsharma@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.10.26 AM',
    location: '8/12, Shakarpur, New Delhi, Delhi, 110092, India',
    gps: '28.628905° N, 77.279136° E (±27m)',
    lat: 28.628905,
    lon: 77.279136,
    acc: 27
  },
  {
    name: 'Lavanya',
    email: 'lavanya@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.31.59 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044164° N, 77.053927° E (±20m)',
    lat: 11.044164,
    lon: 77.053927,
    acc: 20
  },
  {
    name: 'Sridharan',
    email: 'sridharan@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:56:44 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044162° N, 77.053922° E (±20m)',
    lat: 11.044162,
    lon: 77.053922,
    acc: 20
  },
  {
    name: 'Ashwin',
    email: 'ashwin@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '10:07:23 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053925° E (±28m)',
    lat: 11.044166,
    lon: 77.053925,
    acc: 28
  },
  {
    name: 'Sithan',
    email: 'sithan@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '10:05:51 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053925° E (±24m)',
    lat: 11.044166,
    lon: 77.053925,
    acc: 24
  },
  {
    name: 'Ragul',
    email: 'ragul@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:51:26 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Logesh',
    email: 'logesh@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.42.59 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Murali',
    email: 'murali@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:51:21 am',
    location: 'Location recorded',
    gps: '',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Pragathish',
    email: 'pragathish@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.51.26 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Thiru',
    email: 'thiru@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:50:19 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053925° E (±26m)',
    lat: 11.044166,
    lon: 77.053925,
    acc: 26
  },
  {
    name: 'Rohith',
    email: 'rohith@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:43:23 am',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053925° E (±26m)',
    lat: 11.044166,
    lon: 77.053925,
    acc: 26
  },
  {
    name: 'Elangovan',
    email: 'elangovan@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.12.28 AM',
    location: 'G99W+C49, Talamalai R.F., Tamil Nadu, 638506, India',
    gps: '11.518703° N, 77.395421° E (±100m)',
    lat: 11.518703,
    lon: 77.395421,
    acc: 100
  },
  {
    name: 'jagades',
    email: 'jagades@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.37.06 AM',
    location: 'Location recorded',
    gps: '',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Harshad K Shankar',
    email: 'harshadshankar@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.50.33 AM',
    location: 'metro station, 236 Mysore Road, Kengeri, Bengaluru, Karnataka, 560060, India',
    gps: '12.907052° N, 77.475244° E (±12m)',
    lat: 12.907052,
    lon: 77.475244,
    acc: 12
  },
  {
    name: 'Dinesh Babu',
    email: 'dineshbabu@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9.37.34 AM',
    location: '11/15A, KP Link Road, Coimbatore, Tamil Nadu, 641062, India',
    gps: '11.044166° N, 77.053926° E (±20m)',
    lat: 11.044166,
    lon: 77.053926,
    acc: 20
  },
  {
    name: 'Jegan',
    email: 'jegan@kanagamtech.in',
    company: 'kanagamtech',
    date: '2026-09-02',
    time: '9:55:46 am',
    location: '7-45, 6/1 Railway Goods Shed Road, Moosapet, Hyderabad, Telangana, 500018, India',
    gps: '17.468825° N, 78.426990° E (±17m)',
    lat: 17.468825,
    lon: 78.426990,
    acc: 17
  }
];

const newRecords = csvRows.map((r, idx) => {
  const emp = db.employees.find(e => e.email.toLowerCase() === r.email.toLowerCase());
  return {
    id: `att_20260902_${String(idx + 1).padStart(3, '0')}_${Math.random().toString(36).slice(2, 6)}`,
    date: r.date,
    time: r.time,
    user: r.email,
    name: r.name,
    company: r.company,
    department: emp ? emp.department : 'General',
    role: emp ? emp.role : 'Employee',
    location: r.location,
    latitude: r.lat,
    longitude: r.lon,
    accuracy: r.acc,
    gpsFormatted: r.gps,
    mapsUrl: (r.lat && r.lon) ? `https://www.google.com/maps?q=${r.lat},${r.lon}` : null,
    photoUri: emp && emp.photo ? emp.photo : '',
    created_at: '2026-09-02T03:30:00.000Z'
  };
});

// Keep existing 2026-09-01 records
const att0901 = db.attendance.filter(a => a.date !== '2026-09-02');
db.attendance = [...newRecords, ...att0901];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully imported all ${newRecords.length} exact real check-ins from user CSV!`);
