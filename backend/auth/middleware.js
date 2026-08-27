const { verifyAccessToken } = require('./jwt');

const ROLE_HIERARCHY = {
  super_admin: 6,
  admin: 5,
  manager: 4,
  finance: 3,
  it: 2,
  hr: 1,
};

const PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'employees:*', 'attendance:*', 'food:*', 'leaves:*', 'notices:*', 'polls:*',
    'tickets:*', 'claims:*', 'updates:*', 'companies:*', 'management_users:*',
    'dashboard:*', 'reports:*'
  ],
  manager: [
    'employees:*', 'attendance:*', 'food:*', 'leaves:*', 'notices:*', 'polls:*',
    'tickets:read', 'tickets:create', 'claims:manager', 'claims:read',
    'updates:*', 'companies:read', 'dashboard:*', 'reports:*'
  ],
  hr: [
    'attendance:read', 'attendance:export', 'food:read', 'leaves:*',
    'employees:read', 'notices:read', 'polls:read', 'dashboard:read'
  ],
  it: [
    'tickets:*', 'updates:publish', 'updates:read', 'employees:read',
    'dashboard:read', 'notices:read'
  ],
  finance: [
    'claims:finance', 'claims:read', 'notices:*', 'polls:*',
    'employees:read', 'dashboard:read', 'reports:read'
  ],
};

function hasPermission(userRole, requiredPermission) {
  const rolePermissions = PERMISSIONS[userRole] || [];
  
  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(requiredPermission)) return true;
  
  const [resource, action] = requiredPermission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (rolePermissions.includes(wildcardPermission)) return true;
  
  return false;
}

function requirePermission(permission) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userRole = decoded.role;
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Insufficient permissions. Required: ${permission}` 
      });
    }

    req.user = decoded;
    next();
  };
}

function requireAnyPermission(permissions) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userRole = decoded.role;
    const allowed = permissions.some(p => hasPermission(userRole, p));
    
    if (!allowed) {
      return res.status(403).json({ 
        success: false, 
        message: `Insufficient permissions. Required one of: ${permissions.join(', ')}` 
      });
    }

    req.user = decoded;
    next();
  };
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    req.user = decoded;
    next();
  };
}

function optionalAuth(req, res, next) {
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

module.exports = {
  hasPermission,
  requirePermission,
  requireAnyPermission,
  requireRole,
  optionalAuth,
  ROLE_HIERARCHY,
  PERMISSIONS,
};