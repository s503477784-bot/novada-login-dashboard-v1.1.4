const LOGIN_URL = '/auth/login.html';
const VERIFY_URL = '/api/auth/verify';
const LOGOUT_URL = '/api/auth/logout';
const DASHBOARD_BUNDLE = './assets/dashboard-app.js';

const getInitials = (value) => {
  const source = String(value || '').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!source) return 'NV';
  const parts = source.split(/\s+/).slice(0, 2);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

const injectSessionPill = (user) => {
  if (document.getElementById('session-pill')) return;

  const pill = document.createElement('div');
  pill.id = 'session-pill';

  // Build DOM safely using createElement instead of innerHTML
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;right:18px;top:18px;z-index:9999;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.94);border:1px solid rgba(229,231,235,.95);box-shadow:0 10px 24px rgba(15,23,42,.08);backdrop-filter:blur(8px);font-family:Inter,system-ui,sans-serif;';

  const avatar = document.createElement('div');
  avatar.style.cssText = 'width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ede9fe,#f5f3ff);color:#6d28d9;font-size:12px;font-weight:700;';
  avatar.textContent = getInitials(user?.username || user?.email);

  const info = document.createElement('div');
  info.style.cssText = 'display:flex;flex-direction:column;min-width:0;max-width:220px;';
  const label = document.createElement('span');
  label.style.cssText = 'font-size:12px;line-height:1.1;color:#6b7280;';
  label.textContent = 'Signed in';
  const email = document.createElement('span');
  email.style.cssText = 'font-size:13px;font-weight:600;line-height:1.2;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  email.textContent = user?.email || '';
  info.appendChild(label);
  info.appendChild(email);

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.style.cssText = 'border:none;background:#111827;color:#fff;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:600;cursor:pointer;';
  logoutBtn.textContent = 'Log out';
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'NovadaClient' } });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      window.location.replace(LOGIN_URL);
    }
  });

  wrapper.appendChild(avatar);
  wrapper.appendChild(info);
  wrapper.appendChild(logoutBtn);
  pill.appendChild(wrapper);

  // Responsive: hide email text on very small screens
  const mq = window.matchMedia('(max-width: 480px)');
  const applyMobile = (e) => {
    info.style.display = e.matches ? 'none' : 'flex';
  };
  mq.addEventListener('change', applyMobile);
  applyMobile(mq);

  document.body.appendChild(pill);
};

const boot = async () => {
  document.documentElement.classList.add('app-auth-pending');
  try {
    const response = await fetch(VERIFY_URL, { credentials: 'include' });
    if (!response.ok) throw new Error('UNAUTHORIZED');

    const payload = await response.json().catch(() => ({}));
    const user = payload?.data?.user || null;

    // Inject user data for React app to consume — no DOM hacking needed
    window.__APP_AUTH_USER__ = user;
    Object.freeze(window.__APP_AUTH_USER__);

    await import(DASHBOARD_BUNDLE);

    injectSessionPill(user);
    document.documentElement.classList.remove('app-auth-pending');
  } catch (error) {
    console.error('Dashboard auth gate failed:', error);
    window.location.replace(LOGIN_URL);
  }
};

boot();
