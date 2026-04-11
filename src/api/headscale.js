const HEADSCALE_URL = import.meta.env.VITE_HEADSCALE_URL || '';
const API_KEY = import.meta.env.VITE_HEADSCALE_API_KEY || '';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  // const url = `${HEADSCALE_URL}/api/v1${endpoint}`;
  const url = `/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ NODES/MACHINES ============

export async function getNodes() {
  const data = await apiCall('/node');
  return data.nodes || [];
}

export async function getNode(nodeId) {
  const data = await apiCall(`/node/${nodeId}`);
  return data.node;
}

export async function deleteNode(nodeId) {
  return apiCall(`/node/${nodeId}`, { method: 'DELETE' });
}

export async function renameNode(nodeId, newName) {
  return apiCall(`/node/${nodeId}/rename/${newName}`, { method: 'POST' });
}

export async function expireNode(nodeId) {
  return apiCall(`/node/${nodeId}/expire`, { method: 'POST' });
}

export async function getNodeRoutes(nodeId) {
  const data = await apiCall(`/node/${nodeId}/routes`);
  return data.routes || [];
}

// ============ USERS ============

export async function getUsers() {
  const data = await apiCall('/user');
  return data.users || [];
}

export async function createUser(name) {
  return apiCall('/user', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteUser(name) {
  return apiCall(`/user/${name}`, { method: 'DELETE' });
}

export async function renameUser(oldName, newName) {
  return apiCall(`/user/${oldName}/rename/${newName}`, { method: 'POST' });
}

// ============ PRE-AUTH KEYS ============

export async function getPreAuthKeys(user) {
  const data = await apiCall(`/preauthkey?user=${user}`);
  return data.preAuthKeys || [];
}

export async function getAllPreAuthKeys() {
  // Get all users first, then fetch keys for each
  const users = await getUsers();
  const allKeys = [];
  
  for (const user of users) {
    try {
      const keys = await getPreAuthKeys(user.name);
      // allKeys.push(...keys.map(key => ({ ...key, user: user.name })));
      allKeys.push(...keys.map(key => ({ ...key, user: user.name, userId: user.id })));
    } catch (e) {
      console.log('failed to get keys for user:', user.name, e.message)
    }
  }
  
  return allKeys;
}

export async function createPreAuthKey(user, reusable = false, ephemeral = false, expiration = null) {
  const body = {
    user,
    reusable,
    ephemeral,
  };
  
  if (expiration) {
    body.expiration = expiration;
  }
  
  const data = await apiCall('/preauthkey', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  return data.preAuthKey;
}

export async function expirePreAuthKey(user, key) {
  console.log('expiring key:', key)
  return apiCall('/preauthkey/expire', {
    method: 'POST',
    body: JSON.stringify({ user, key }),
  });
}


export async function deletePreAuthKey(keyId) {
  console.log('deleting key with id:', keyId)
  return apiCall(`/preauthkey?id=${keyId}`, { 
    method: 'DELETE' 
  });
}
// ============ API KEYS ============

export async function getApiKeys() {
  const data = await apiCall('/apikey');
  return data.apiKeys || [];
}

export async function createApiKey(expiration = null) {
  const body = expiration ? { expiration } : {};
  return apiCall('/apikey', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function expireApiKey(prefix) {
  return apiCall('/apikey/expire', {
    method: 'POST',
    body: JSON.stringify({ prefix }),
  });
}

// ============ ROUTES ============

export async function getRoutes() {
  const data = await apiCall('/routes');
  return data.routes || [];
}

export async function enableRoute(routeId) {
  return apiCall(`/routes/${routeId}/enable`, { method: 'POST' });
}

export async function disableRoute(routeId) {
  return apiCall(`/routes/${routeId}/disable`, { method: 'POST' });
}

// ============ POLICY/ACL ============

export async function getPolicy() {
  const data = await apiCall('/policy');
  return data.policy;
}

export async function setPolicy(policy) {
  return apiCall('/policy', {
    method: 'PUT',
    body: JSON.stringify({ policy }),
  });
}

// ============ UTILITY ============

export function isConfigured() {
  return Boolean(HEADSCALE_URL && API_KEY);
}

export function getConfig() {
  return {
    url: HEADSCALE_URL,
    hasApiKey: Boolean(API_KEY),
  };
}
