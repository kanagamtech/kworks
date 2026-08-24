require('dotenv').config();
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');

const PORT = process.env.PORT || 5000;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    // Health Check
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { status: 'ok', service: 'kworks-backend', timestamp: new Date().toISOString() });
    }

    // Database Reset Route
    if (pathname === '/api/db/reset' && req.method === 'POST') {
      const resetData = db.reset();
      return sendJSON(res, 200, { success: true, message: 'Database reset successfully to clean initial state', data: resetData });
    }

    // Authentication / Login Route (Checks if employee exists in DB)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();
      const company = (body.company || '').trim().toLowerCase();

      if (!email) {
        return sendJSON(res, 400, { success: false, message: 'Email is required to log in.' });
      }

      const employees = db.getEmployees();
      const match = employees.find((e) => e.email?.trim().toLowerCase() === email);

      if (!match) {
        return sendJSON(res, 404, {
          success: false,
          message: `Account not found in company database. Please contact HR or Manager to onboard your account.`
        });
      }

      if (company && match.company && match.company.trim().toLowerCase() !== company) {
        return sendJSON(res, 400, {
          success: false,
          message: `This account is registered under company "${match.company}", not "${body.company}".`
        });
      }

      if (match.password && password && match.password.trim() !== password) {
        return sendJSON(res, 401, {
          success: false,
          message: 'Incorrect password. Please try again.'
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Login successful',
        user: {
          name: match.name,
          email: match.email,
          company: match.company || 'kanagamtech',
          department: match.department || 'General',
          destination: match.destination || match.role || 'Employee',
          photoUri: match.photo || null,
        }
      });
    }

    // Companies Routes
    if (pathname === '/api/companies' || pathname.startsWith('/api/companies/')) {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getCompanies() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.name) {
          return sendJSON(res, 400, { success: false, message: 'Company name is required.' });
        }
        const updated = db.addCompany(body.name);
        return sendJSON(res, 200, { success: true, data: updated });
      }
      if (req.method === 'DELETE') {
        const companyName = decodeURIComponent(pathname.split('/')[3] || '');
        const updated = db.deleteCompany(companyName);
        return sendJSON(res, 200, { success: true, data: updated });
      }
    }

    // Employee Onboarding Routes
    if (pathname === '/api/employees' || pathname.startsWith('/api/employees/')) {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getEmployees() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.email) {
          return sendJSON(res, 400, { success: false, message: 'Name and email are required.' });
        }
        body.role = body.role || body.destination || 'Employee';
        const emp = db.addEmployee(body);
        return sendJSON(res, 200, { success: true, data: emp });
      }
      if (req.method === 'DELETE') {
        const empId = pathname.split('/')[3];
        const updated = db.deleteEmployee(empId);
        return sendJSON(res, 200, { success: true, data: updated });
      }
    }

    // Attendance Routes
    if (pathname === '/api/attendance' || pathname.startsWith('/api/attendance/')) {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getAttendance() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.date || !body.user) {
          return sendJSON(res, 400, { success: false, message: 'Date and user are required.' });
        }
        const record = db.addAttendance(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
      if (req.method === 'DELETE') {
        const parts = pathname.split('/');
        if (parts.length > 3) {
          // Delete single attendance record by ID
          const attId = parts[3];
          const updated = db.deleteAttendance(attId);
          return sendJSON(res, 200, { success: true, data: updated });
        } else {
          // Clear all attendance records
          const updated = db.clearAttendance();
          return sendJSON(res, 200, { success: true, data: updated });
        }
      }
    }

    // Food Count Routes
    if (pathname === '/api/food' || pathname === '/api/food-counts' || pathname === '/api/foodcounts') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getFoodCounts() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.saveFoodCount(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Leave Requests Routes
    if (pathname === '/api/leaves') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getLeaves() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.saveLeaves(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Support Tickets Routes
    if (pathname === '/api/tickets') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getTickets() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.saveTickets(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Announcements / Notices Routes
    if (pathname === '/api/notices') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getNotices() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.saveNotices(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Polls Routes
    if (pathname === '/api/polls') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getPolls() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.savePolls(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Manager Notifications Routes
    if (pathname === '/api/notifications' || pathname.startsWith('/api/notifications/')) {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getNotifications() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.addNotification(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Claims / Request Advance & Reimbursements Routes
    if (pathname === '/api/claims' || pathname.startsWith('/api/claims/')) {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getClaims() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.addClaim(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
      if (req.method === 'PUT') {
        const parts = pathname.split('/');
        if (parts.length > 3) {
          const claimId = parts[3];
          const body = await parseBody(req);
          const currentClaims = db.getClaims();
          const idx = currentClaims.findIndex((c) => c.id === claimId);
          if (idx >= 0) {
            currentClaims[idx] = { ...currentClaims[idx], ...body, updated_at: new Date().toISOString() };
            db.saveClaims(currentClaims);
            return sendJSON(res, 200, { success: true, data: currentClaims[idx] });
          }
          return sendJSON(res, 404, { success: false, message: 'Claim request not found' });
        }
      }
    }

    // Chat Routes (WhatsApp in company)
    if (pathname === '/api/chat') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getChatMessages() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.addChatMessage(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Chat Groups Routes
    if (pathname === '/api/chat/groups') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: db.getChatGroups() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = db.addChatGroup(body);
        return sendJSON(res, 200, { success: true, data: record });
      }
    }

    // Static Web Dashboard Routes
    if (pathname === '/management' || pathname === '/management/' || pathname === '/management/index.html') {
      const filePath = path.join(__dirname, '../site/management/index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(filePath, 'utf8'));
    }
    if (pathname === '/management/logo.png') {
      const filePath = path.join(__dirname, '../site/management/logo.png');
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(fs.readFileSync(filePath));
    }
    if (pathname === '/hr' || pathname === '/hr/' || pathname === '/hr/index.html') {
      const filePath = path.join(__dirname, '../site/hr/index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(filePath, 'utf8'));
    }

    // 404 Not Found
    sendJSON(res, 404, { success: false, message: 'Route not found' });
  } catch (err) {
    console.error('Server error:', err);
    sendJSON(res, 500, { success: false, message: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`[KwOrKs Backend Server] Running on http://localhost:${PORT}`);
});
