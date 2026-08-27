require('dotenv').config();
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('./auth/jwt');
const { requirePermission, requireAnyPermission, requireRole, optionalAuth, hasPermission } = require('./auth/middleware');

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

function attachUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
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

  attachUser(req, res, async () => {
    try {
      // Health Check
      if (pathname === '/api/health') {
        return sendJSON(res, 200, { status: 'ok', service: 'kworks-backend', timestamp: new Date().toISOString() });
      }

      // Auth Routes (Public)
      if (pathname === '/api/auth/management/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const email = (body.email || '').trim().toLowerCase();
        const password = (body.password || '').trim();

        if (!email || !password) {
          return sendJSON(res, 400, { success: false, message: 'Email and password are required' });
        }

        const user = await db.verifyManagementUser(email, password);
        if (!user) {
          return sendJSON(res, 401, { success: false, message: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

        return sendJSON(res, 200, {
          success: true,
          message: 'Login successful',
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
        });
      }

      if (pathname === '/api/auth/management/refresh' && req.method === 'POST') {
        const body = await parseBody(req);
        const refreshToken = body.refreshToken;

        if (!refreshToken) {
          return sendJSON(res, 400, { success: false, message: 'Refresh token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
          return sendJSON(res, 401, { success: false, message: 'Invalid or expired refresh token' });
        }

        const user = db.getManagementUsers().find(u => u.id === decoded.id);
        if (!user) {
          return sendJSON(res, 401, { success: false, message: 'User not found' });
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

        return sendJSON(res, 200, { success: true, accessToken, refreshToken: newRefreshToken });
      }

      if (pathname === '/api/auth/management/me' && req.method === 'GET') {
        if (!req.user) {
          return sendJSON(res, 401, { success: false, message: 'Not authenticated' });
        }
        const user = db.getManagementUsers().find(u => u.id === req.user.id);
        if (!user) {
          return sendJSON(res, 404, { success: false, message: 'User not found' });
        }
        return sendJSON(res, 200, { success: true, user });
      }

      // Protected Routes - require authentication
      const protectedRoute = (handler, permission) => {
        return async (req, res) => {
          if (!req.user) {
            return sendJSON(res, 401, { success: false, message: 'Authentication required' });
          }
          if (permission && !hasPermission(req.user.role, permission)) {
            return sendJSON(res, 403, { success: false, message: `Insufficient permissions. Required: ${permission}` });
          }
          return handler(req, res);
        };
      };

      // Database Reset Route (Super Admin only)
      if (pathname === '/api/db/reset' && req.method === 'POST') {
        return protectedRoute(async () => {
          const resetData = db.reset();
          return sendJSON(res, 200, { success: true, message: 'Database reset successfully to clean initial state', data: resetData });
        }, 'management_users:delete')(req, res);
      }

      // Management Users Routes (Super Admin only)
      if (pathname === '/api/management-users' || pathname.startsWith('/api/management-users/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getManagementUsers() });
          }, 'management_users:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            if (!body.email || !body.password || !body.role || !body.name) {
              return sendJSON(res, 400, { success: false, message: 'Email, password, role, and name are required' });
            }
            try {
              const created = await db.addManagementUser(body);
              return sendJSON(res, 200, { success: true, data: created });
            } catch (e) {
              return sendJSON(res, 400, { success: false, message: e.message });
            }
          }, 'management_users:create')(req, res);
        }
        if (req.method === 'PUT') {
          return protectedRoute(async () => {
            const parts = pathname.split('/');
            const userId = parts[3];
            const body = await parseBody(req);
            const updated = await db.updateManagementUser(userId, body);
            if (!updated) {
              return sendJSON(res, 404, { success: false, message: 'User not found' });
            }
            return sendJSON(res, 200, { success: true, data: updated });
          }, 'management_users:update')(req, res);
        }
        if (req.method === 'DELETE') {
          return protectedRoute(async () => {
            const parts = pathname.split('/');
            const userId = parts[3];
            const updated = db.deleteManagementUser(userId);
            return sendJSON(res, 200, { success: true, data: updated });
          }, 'management_users:delete')(req, res);
        }
      }

      // App Version & Remote Update Routes
      if (pathname === '/api/app-updates' || pathname === '/api/app-version') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getAppUpdate() });
          }, 'updates:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            if (!body.version) {
              return sendJSON(res, 400, { success: false, message: 'Version is required.' });
            }
            const updated = db.publishAppUpdate(body);
            return sendJSON(res, 200, {
              success: true,
              message: 'App update broadcasted successfully to all user devices',
              data: updated,
            });
          }, 'updates:publish')(req, res);
        }
      }

      // Companies Routes
      if (pathname === '/api/companies' || pathname.startsWith('/api/companies/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getCompanies() });
          }, 'companies:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            if (!body.name) {
              return sendJSON(res, 400, { success: false, message: 'Company name is required.' });
            }
            const updated = db.addCompany(body.name);
            return sendJSON(res, 200, { success: true, data: updated });
          }, 'companies:create')(req, res);
        }
        if (req.method === 'DELETE') {
          return protectedRoute(async () => {
            const companyName = decodeURIComponent(pathname.split('/')[3] || '');
            const updated = db.deleteCompany(companyName);
            return sendJSON(res, 200, { success: true, data: updated });
          }, 'companies:delete')(req, res);
        }
      }

      // Employee Onboarding Routes
      if (pathname === '/api/employees' || pathname.startsWith('/api/employees/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getEmployees() });
          }, 'employees:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            if (!body.name || !body.email) {
              return sendJSON(res, 400, { success: false, message: 'Name and email are required.' });
            }
            body.role = body.role || body.destination || 'Employee';
            const emp = db.addEmployee(body);
            return sendJSON(res, 200, { success: true, data: emp });
          }, 'employees:create')(req, res);
        }
        if (req.method === 'DELETE') {
          return protectedRoute(async () => {
            const empId = pathname.split('/')[3];
            const updated = db.deleteEmployee(empId);
            return sendJSON(res, 200, { success: true, data: updated });
          }, 'employees:delete')(req, res);
        }
      }

      // Attendance Routes
      if (pathname === '/api/attendance' || pathname.startsWith('/api/attendance/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getAttendance() });
          }, 'attendance:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            if (!body.date || !body.user) {
              return sendJSON(res, 400, { success: false, message: 'Date and user are required.' });
            }
            const record = db.addAttendance(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'attendance:create')(req, res);
        }
        if (req.method === 'DELETE') {
          return protectedRoute(async () => {
            const parts = pathname.split('/');
            if (parts.length > 3) {
              const attId = parts[3];
              const updated = db.deleteAttendance(attId);
              return sendJSON(res, 200, { success: true, data: updated });
            } else {
              const updated = db.clearAttendance();
              return sendJSON(res, 200, { success: true, data: updated });
            }
          }, 'attendance:delete')(req, res);
        }
      }

      // Food Count Routes
      if (pathname === '/api/food' || pathname === '/api/food-counts' || pathname === '/api/foodcounts') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getFoodCounts() });
          }, 'food:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.saveFoodCount(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'food:create')(req, res);
        }
      }

      // Leave Requests Routes
      if (pathname === '/api/leaves') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getLeaves() });
          }, 'leaves:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.saveLeaves(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'leaves:create')(req, res);
        }
      }

      // Support Tickets Routes
      if (pathname === '/api/tickets') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getTickets() });
          }, 'tickets:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.saveTickets(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'tickets:create')(req, res);
        }
      }

      // Announcements / Notices Routes
      if (pathname === '/api/notices') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getNotices() });
          }, 'notices:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.saveNotices(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'notices:create')(req, res);
        }
      }

      // Polls Routes
      if (pathname === '/api/polls') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getPolls() });
          }, 'polls:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.savePolls(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'polls:create')(req, res);
        }
      }

      // Manager Notifications Routes
      if (pathname === '/api/notifications' || pathname.startsWith('/api/notifications/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getNotifications() });
          }, 'notifications:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.addNotification(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'notifications:create')(req, res);
        }
      }

      // Claims / Request Advance & Reimbursements Routes
      if (pathname === '/api/claims' || pathname.startsWith('/api/claims/')) {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getClaims() });
          }, 'claims:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.addClaim(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'claims:create')(req, res);
        }
        if (req.method === 'PUT') {
          return protectedRoute(async () => {
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
          }, 'claims:update')(req, res);
        }
      }

      // Chat Routes (WhatsApp in company)
      if (pathname === '/api/chat') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getChatMessages() });
          }, 'chat:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.addChatMessage(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'chat:create')(req, res);
        }
      }

      // Chat Groups Routes
      if (pathname === '/api/chat/groups') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            return sendJSON(res, 200, { success: true, data: db.getChatGroups() });
          }, 'chat:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.addChatGroup(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'chat:create')(req, res);
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[KwOrKs Backend Server] Running on port ${PORT} (0.0.0.0)`);
});