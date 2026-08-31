const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const Email = require('../models/Email');
const Template = require('../models/Template');
const { AutomationRule, AutomationLog } = require('../models/Automation');
const User = require('../models/User');
const Quote = require('../models/Quote');

let isConnected = false;

async function connectMongoDB(uri) {
  if (!uri) return false;
  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('✅ [CRM MongoDB] Connected successfully to:', uri.replace(/\/\/.*@/, '//***@'));
    return true;
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ [CRM MongoDB] Connection failed. Operating in high-speed JSON fallback mode.', err.message);
    return false;
  }
}

function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectMongoDB,
  getIsConnected,
  Models: {
    User,
    Lead,
    Contact,
    Company,
    Deal,
    Task,
    Email,
    Template,
    AutomationRule,
    AutomationLog,
    Quote
  }
};
