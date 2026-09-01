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
  const startTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const method = req.method;
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Intercept response for clean, formatted API console logging
  const origEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const status = res.statusCode || 200;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    console.log(`[KwOrKs API] ${new Date().toISOString().slice(11, 19)} | ${statusColor}${status}${resetColor} | ${method.padEnd(6)} ${pathname} | ${duration}ms | IP: ${clientIp}`);
    return origEnd.apply(this, args);
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  attachUser(req, res, async () => {
    try {
      // Health Check
      if (pathname === '/api/health') {
        return sendJSON(res, 200, {
          status: 'ok',
          service: 'kworks-backend',
          database: db.isConnectedToMongo() ? 'MongoDB' : 'Local JSON Fallback',
          timestamp: new Date().toISOString(),
        });
      }

      // Mobile App Employee DB Authentication Route
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
          console.warn(`[KwOrKs Auth] Login failed: Account "${email}" not found in database.`);
          return sendJSON(res, 404, {
            success: false,
            message: `Account "${email}" is not registered in the database. Please contact HR or Manager to onboard your account.`,
          });
        }

        if (company && match.company && match.company.trim().toLowerCase() !== company) {
          console.warn(`[KwOrKs Auth] Company mismatch: "${company}" vs registered "${match.company}"`);
          return sendJSON(res, 400, {
            success: false,
            message: `This account is registered under company "${match.company}", not "${body.company}".`,
          });
        }

        if (match.password && password && match.password.trim() !== password) {
          console.warn(`[KwOrKs Auth] Password mismatch for account "${email}"`);
          return sendJSON(res, 401, {
            success: false,
            message: 'Incorrect password. Please verify your credentials and try again.',
          });
        }

        console.log(`[KwOrKs Auth] Successful mobile login for "${match.name}" (${match.email})`);
        return sendJSON(res, 200, {
          success: true,
          message: 'Login successful',
          user: {
            id: match.id,
            name: match.name,
            email: match.email,
            company: match.company || 'kanagamtech',
            department: match.department || 'General',
            destination: match.destination || match.role || 'Employee',
            photoUri: match.photo || null,
          },
        });
      }

      // Management Portal Role Login Route (Public)
      if ((pathname === '/api/auth/management-login' || pathname === '/api/auth/management/login') && req.method === 'POST') {
        const body = await parseBody(req);
        const email = (body.email || '').trim().toLowerCase();
        const password = (body.password || '').trim();
        const requestedRole = (body.role || '').trim().toLowerCase();

        if (!email || !password) {
          return sendJSON(res, 400, { success: false, message: 'Email and password are required.' });
        }

        const mgmtUser = db.getManagementUsers().find(u => u.email?.toLowerCase() === email);
        let authenticatedUser = null;

        if (mgmtUser) {
          // Account exists in database: database bcrypt hash is the STRICT authority
          authenticatedUser = await db.verifyManagementUser(email, password);
          if (!authenticatedUser) {
            console.warn(`[KwOrKs Auth] Management login failed: Incorrect database password for ${email}`);
            return sendJSON(res, 401, {
              success: false,
              message: 'Incorrect password for this management account. Default credentials are no longer accepted once an account is configured.',
            });
          }
        } else {
          // Fallback only if the account is not yet seeded in the database
          const MGMT_USERS = {
            super_admin: { email: 'superadmin@kworks.com', pass: 'SuperAdmin@2026!' },
            admin: { email: 'admin@kworks.com', pass: 'Admin@2026!' },
            manager: { email: 'manager@kworks.com', pass: 'Manager@2026!' },
            hr: { email: 'hr@kworks.com', pass: 'HR@2026!' },
            it: { email: 'itsupport@kworks.com', pass: 'ITSupport@2026!' },
            finance: { email: 'accounts@kworks.com', pass: 'Accounts@2026!' },
          };

          const cred = MGMT_USERS[requestedRole];
          const isDefaultCred =
            (cred && email === cred.email.toLowerCase() && password === cred.pass) ||
            (requestedRole === 'finance' && email === 'finance@kworks.com' && password === 'Finance@2026!');
          if (isDefaultCred) {
            authenticatedUser = {
              id: `mgmt_${requestedRole}`,
              email: email,
              role: requestedRole,
              name: `${requestedRole.toUpperCase()} Administrator`,
              department: 'Management',
            };
          } else {
            console.warn(`[KwOrKs Auth] Management login failed for ${email}`);
            return sendJSON(res, 401, {
              success: false,
              message: `Invalid management credentials for "${email}". Please verify your email and password.`,
            });
          }
        }

        const activeRole = authenticatedUser.role || requestedRole || 'manager';
        const userPayload = {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          role: activeRole,
          name: authenticatedUser.name || `${activeRole.toUpperCase()} Administrator`,
          department: authenticatedUser.department || 'Management',
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        console.log(`[KwOrKs Auth] Management portal logged in as ${activeRole.toUpperCase()} (${email})`);
        return sendJSON(res, 200, {
          success: true,
          message: `Logged in as ${activeRole.toUpperCase()}`,
          accessToken,
          refreshToken,
          role: activeRole,
          user: userPayload,
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

        const accessToken = generateAccessToken({ id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name || 'Manager' });
        const newRefreshToken = generateRefreshToken({ id: decoded.id, email: decoded.email, role: decoded.role });

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

      // Protected Routes - checks permissions when token is present
      const protectedRoute = (handler, permission) => {
        return async (req, res) => {
          if (req.user && permission && !hasPermission(req.user.role, permission)) {
            return sendJSON(res, 403, { success: false, message: `Insufficient permissions for role "${req.user.role}". Required: ${permission}` });
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
            try {
              const updated = db.deleteManagementUser(userId);
              return sendJSON(res, 200, { success: true, data: updated });
            } catch (e) {
              return sendJSON(res, 400, { success: false, message: e.message });
            }
          }, 'management_users:delete')(req, res);
        }
      }

      // App Version & Remote Update Routes
      if (pathname === '/api/app-updates' || pathname === '/api/app-version') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            const update = db.getAppUpdate() || {};
            // Enforce baseline v1.0.0 to permanently stop the update modal popup loop on all phones
            return sendJSON(res, 200, {
              success: true,
              data: {
                ...update,
                version: '1.0.0',
                title: 'KwOrKs Up to Date',
                notes: 'All systems operational.',
                mandatory: false,
              },
            });
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

      // Notifications Routes
      if (pathname === '/api/notifications') {
        if (req.method === 'GET') {
          return protectedRoute(async () => {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const userEmail = urlObj.searchParams.get('userEmail');
            const data = db.getNotifications(userEmail);
            return sendJSON(res, 200, { success: true, data });
          }, 'notices:read')(req, res);
        }
        if (req.method === 'POST') {
          return protectedRoute(async () => {
            const body = await parseBody(req);
            const record = db.addNotification(body);
            return sendJSON(res, 200, { success: true, data: record });
          }, 'notices:read')(req, res);
        }
      }

      // Chat Read Status
      if (pathname === '/api/chat/read' && req.method === 'POST') {
        return protectedRoute(async () => {
          const body = await parseBody(req);
          db.markChatAsRead(body.userEmail, body.conversationId);
          return sendJSON(res, 200, { success: true });
        }, 'chat:create')(req, res);
      }

      // Chat Message Reactions
      const chatReactMatch = pathname.match(/^\/api\/chat\/messages\/([^\/]+)\/react$/);
      if (chatReactMatch && req.method === 'POST') {
        return protectedRoute(async () => {
          const body = await parseBody(req);
          const updated = db.reactToChatMessage(chatReactMatch[1], body.userEmail, body.reaction);
          return sendJSON(res, 200, { success: true, data: updated });
        }, 'chat:create')(req, res);
      }

      // Delete Chat Message (Marks as deleted with user name and 70-min limit)
      const chatDeleteMatch = pathname.match(/^\/api\/chat\/messages\/([^\/]+)(?:\/delete)?$/);
      if (chatDeleteMatch && (req.method === 'DELETE' || req.method === 'POST')) {
        return protectedRoute(async () => {
          let body = {};
          try { body = await parseBody(req); } catch {}
          const result = db.deleteChatMessage(chatDeleteMatch[1], body.userEmail, body.userName);
          return sendJSON(res, result.success ? 200 : 400, result);
        }, 'chat:create')(req, res);
      }

      // Edit Chat Message (70-min limit)
      const chatEditMatch = pathname.match(/^\/api\/chat\/messages\/([^\/]+)\/edit$/);
      if (chatEditMatch && req.method === 'POST') {
        return protectedRoute(async () => {
          const body = await parseBody(req);
          const result = db.editChatMessage(chatEditMatch[1], body.text, body.userEmail);
          return sendJSON(res, result.success ? 200 : 400, result);
        }, 'chat:create')(req, res);
      }

      // Chat Group Member Add
      const groupAddMatch = pathname.match(/^\/api\/chat\/groups\/([^\/]+)\/members$/);
      if (groupAddMatch && req.method === 'POST') {
        return protectedRoute(async () => {
          const body = await parseBody(req);
          const updated = db.addMemberToGroup(groupAddMatch[1], body.email);
          return sendJSON(res, 200, { success: true, data: updated });
        }, 'chat:create')(req, res);
      }

      // Chat Group Member Remove
      const groupRemoveMatch = pathname.match(/^\/api\/chat\/groups\/([^\/]+)\/members\/([^\/]+)$/);
      if (groupRemoveMatch && req.method === 'DELETE') {
        return protectedRoute(async () => {
          const email = decodeURIComponent(groupRemoveMatch[2]);
          const updated = db.removeMemberFromGroup(groupRemoveMatch[1], email);
          return sendJSON(res, 200, { success: true, data: updated });
        }, 'chat:create')(req, res);
      }

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function tryServeStatic(res, baseDir, relativePath) {
  try {
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    let target = path.join(baseDir, safePath);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      const ext = path.extname(target).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      fs.createReadStream(target).pipe(res);
      return true;
    }
  } catch {}
  return false;
}

function findSitePath(subPath) {
  const candidates = [
    path.join(__dirname, 'site', subPath),
    path.join(__dirname, '../site', subPath),
    path.join(__dirname, 'site/dist', subPath),
    path.join(__dirname, '../site/dist', subPath),
    path.join(__dirname, subPath),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

      // ── Management Portal Route ───────────────────────────────────────────
      if (pathname === '/management' || pathname === '/management/' || pathname === '/management/index.html') {
        const mgmtHtml = findSitePath('management/index.html') || findSitePath('dist/index.html') || findSitePath('index.html');
        if (mgmtHtml) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(fs.readFileSync(mgmtHtml, 'utf8'));
        }
      }

      // ── HR Portal Route ───────────────────────────────────────────────────
      if (pathname === '/hr' || pathname === '/hr/' || pathname === '/hr/index.html') {
        const hrHtml = findSitePath('hr/index.html') || findSitePath('dist/index.html') || findSitePath('index.html');
        if (hrHtml) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(fs.readFileSync(hrHtml, 'utf8'));
        }
      }

      // ── Static site assets (e.g. /management/logo.png, /logo.png, /assets/*) ──
      if (pathname.startsWith('/management/') || pathname.startsWith('/hr/')) {
        const relativeSub = pathname.replace(/^\/(management|hr)\//, '');
        const assetPath = findSitePath(`management/${relativeSub}`) || findSitePath(`hr/${relativeSub}`) || findSitePath(relativeSub) || findSitePath(`public/${relativeSub}`);
        if (assetPath && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
          const ext = path.extname(assetPath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          return fs.createReadStream(assetPath).pipe(res);
        }
      }

      // ── Serve Expo Web App (Mobile App in Browser) from app/dist or app_dist ─
      const appDistDirs = [
        path.join(__dirname, '../app/dist'),
        path.join(__dirname, 'app_dist'),
        path.join(__dirname, './dist')
      ];

      for (const distDir of appDistDirs) {
        if (fs.existsSync(distDir)) {
          if (tryServeStatic(res, distDir, pathname)) {
            return;
          }
          // Fallback to index.html for SPA web routes (non-API and non-management/hr)
          if (!pathname.startsWith('/api/') && !pathname.startsWith('/management') && !pathname.startsWith('/hr')) {
            const indexHtml = path.join(distDir, 'index.html');
            if (fs.existsSync(indexHtml)) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              return fs.createReadStream(indexHtml).pipe(res);
            }
          }
        }
      }

      // 404 Not Found
      sendJSON(res, 404, { success: false, message: 'Route not found' });
    } catch (err) {
      console.error('Server error:', err);
      sendJSON(res, 500, { success: false, message: 'Internal Server Error' });
    }
  });
});

const https = require('https');

// ── Keep-Alive Heartbeat Engine (Every 20 Seconds) ─────────────────────────
// Automatically self-pings the public Render cloud domain to prevent cold spin-down
function startHeartbeatEngine() {
  const targetUrl = process.env.RENDER_EXTERNAL_URL ||
    process.env.APP_URL ||
    process.env.BACKEND_URL ||
    'https://kworks-2q0c.onrender.com';

  const healthUrl = `${targetUrl.replace(/\/+$/, '')}/api/health`;
  const INTERVAL_MS = 20 * 1000; // 20 seconds

  console.log(`[KwOrKs Heartbeat] Active 20s Keep-Alive Pulse -> ${healthUrl}`);

  setInterval(() => {
    try {
      const client = healthUrl.startsWith('https') ? https : http;
      const req = client.get(healthUrl, { timeout: 10000 }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {});
      });

      req.on('error', () => {});
      req.on('timeout', () => { req.destroy(); });
    } catch {}
  }, INTERVAL_MS);
}


// Wait for MongoDB to fully load data before starting the server
// This prevents race conditions where requests arrive before chat data is restored
async function startServer() {
  // Give MongoDB init time to complete (it was called in Database constructor)
  await db.initReady;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[KwOrKs Backend Server] Running on port ${PORT} (0.0.0.0)`);
    startHeartbeatEngine();
  });
}

startServer().catch((err) => {
  console.error('[KwOrKs] Fatal startup error:', err);
  // Fall back to immediate start even if MongoDB fails
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[KwOrKs Backend Server] Running on port ${PORT} (MongoDB unavailable)`);
    startHeartbeatEngine();
  });
});