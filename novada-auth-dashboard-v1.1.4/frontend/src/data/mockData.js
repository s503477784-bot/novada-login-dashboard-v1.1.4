export const appProfile = {
  initials: 'NT',
  displayName: 'Novada Team',
  email: 'team@novada.example',
  plan: 'Demo Workspace',
  welcomeName: 'Operator',
  defaultUserPrefix: 'team_proxy_',
}

export const defaultGeneratorPassword = '••••••••'

export const authUsers = [
  'team_proxy_crawler01',
  'team_proxy_collector',
  'team_proxy_monitor',
]

export const trafficData = [
  { day: 'Jan 25', gb: 2.1 },
  { day: 'Jan 27', gb: 3.4 },
  { day: 'Jan 29', gb: 1.8 },
  { day: 'Jan 31', gb: 4.2 },
  { day: 'Feb 02', gb: 3.9 },
  { day: 'Feb 04', gb: 5.1 },
  { day: 'Feb 06', gb: 4.7 },
  { day: 'Feb 08', gb: 6.3 },
  { day: 'Feb 10', gb: 5.8 },
  { day: 'Feb 12', gb: 7.2 },
  { day: 'Feb 14', gb: 6.1 },
  { day: 'Feb 16', gb: 8.4 },
  { day: 'Feb 18', gb: 7.9 },
  { day: 'Feb 20', gb: 9.1 },
  { day: 'Feb 22', gb: 8.5 },
]

export const requestData = [
  { day: 'W1', requests: 12400 },
  { day: 'W2', requests: 18200 },
  { day: 'W3', requests: 15800 },
  { day: 'W4', requests: 22100 },
]

export const auditLogs = [
  { id: 1, action: 'Whitelist IP added', detail: '203.0.113.42', time: '2 min ago', type: 'create' },
  { id: 2, action: 'Proxy user created', detail: 'team_proxy_scraper', time: '18 min ago', type: 'create' },
  { id: 3, action: 'Password regenerated', detail: 'team_proxy_crawler01', time: '1 hour ago', type: 'update' },
  { id: 4, action: 'Bandwidth plan upgraded', detail: 'Rotating -> Advanced', time: '3 hours ago', type: 'upgrade' },
  { id: 5, action: 'Whitelist IP removed', detail: '198.51.100.7', time: '5 hours ago', type: 'delete' },
  { id: 6, action: 'Endpoint exported', detail: '500 proxies (TXT)', time: '1 day ago', type: 'export' },
]

export const rotatingPlans = [
  { name: 'Basic', pricePerGb: 12.5, monthlyBase: 0, bandwidth: '1 GB', features: ['Country targeting', 'HTTP/SOCKS5', 'Rotating mode'] },
  { name: 'Micro', pricePerGb: 9.0, monthlyBase: 45, bandwidth: '5 GB', features: ['Country + City targeting', 'HTTP/SOCKS5', 'Rotating + Sticky'] },
  { name: 'Starter', pricePerGb: 6.5, monthlyBase: 130, bandwidth: '20 GB', features: ['Country + City + ASN', 'HTTP/SOCKS5', 'Rotating + Sticky', 'API access'] },
  { name: 'Advanced', pricePerGb: 4.0, monthlyBase: 400, bandwidth: '100 GB', popular: true, features: ['Full geo-targeting', 'HTTP/SOCKS5', 'All session modes', 'API access', 'Priority support'] },
]

export const unlimitedPlans = [
  { name: '10 Ports', ports: 10, monthlyPrice: 60, perPort: 6.0, protocols: 'SOCKS5 / HTTP', uptime: '99.9%' },
  { name: '50 Ports', ports: 50, monthlyPrice: 250, perPort: 5.0, protocols: 'SOCKS5 / HTTP', uptime: '99.9%', popular: true },
  { name: '200 Ports', ports: 200, monthlyPrice: 800, perPort: 4.0, protocols: 'SOCKS5 / HTTP', uptime: '99.95%' },
  { name: '500 Ports', ports: 500, monthlyPrice: 1500, perPort: 3.0, protocols: 'SOCKS5 / HTTP', uptime: '99.99%' },
]

export const proxyUsers = [
  { id: 1, username: 'team_proxy_crawler01', password: '••••••••', status: 'active', note: 'Web scraper - Server A', traffic: '2.4 GB / 10 GB' },
  { id: 2, username: 'team_proxy_collector', password: '••••••••', status: 'active', note: 'Data collection bot', traffic: '8.1 GB / Shared' },
  { id: 3, username: 'team_proxy_monitor', password: '••••••••', status: 'disabled', note: 'Price monitoring', traffic: '0 GB / 5 GB' },
  { id: 4, username: 'team_proxy_test', password: '••••••••', status: 'active', note: 'Testing account', traffic: '0.3 GB / 1 GB' },
]

export const whitelistedIps = [
  { id: 1, ip: '203.0.113.42', note: 'Cloud Server - New York', addedDate: '2026-02-20' },
  { id: 2, ip: '198.51.100.14', note: 'Office VPN Gateway', addedDate: '2026-02-18' },
  { id: 3, ip: '192.0.2.88', note: 'Home Backup IP', addedDate: '2026-02-15' },
  { id: 4, ip: '100.24.56.192', note: 'AWS Lambda - Production', addedDate: '2026-02-10' },
]

export const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
]

export const billingRecords = [
  { id: 1,  date: '2026-03-12', type: 'Recharge',  description: 'Account balance top-up',                    amount: 500.00,  paymentMethod: 'Visa ••••4242',      status: 'Completed', invoiceNumber: 'INV-2026-0048' },
  { id: 2,  date: '2026-03-05', type: 'Purchase',  description: 'Rotating Proxies — Advanced Plan (100 GB)',  amount: 400.00,  paymentMethod: 'Visa ••••4242',      status: 'Completed', invoiceNumber: 'INV-2026-0047' },
  { id: 3,  date: '2026-02-28', type: 'Recharge',  description: 'Account balance top-up',                    amount: 250.00,  paymentMethod: 'PayPal',             status: 'Completed', invoiceNumber: 'INV-2026-0044' },
  { id: 4,  date: '2026-02-20', type: 'Purchase',  description: 'Static ISP Proxies — 50 Ports (1 month)',   amount: 250.00,  paymentMethod: 'Mastercard ••••8831', status: 'Completed', invoiceNumber: 'INV-2026-0041' },
  { id: 5,  date: '2026-02-14', type: 'Refund',    description: 'Service credit — downtime compensation',     amount: 18.50,   paymentMethod: 'Original method',    status: 'Completed', invoiceNumber: 'INV-2026-0039' },
  { id: 6,  date: '2026-02-10', type: 'Recharge',  description: 'Account balance top-up',                    amount: 150.00,  paymentMethod: 'Crypto (BTC)',        status: 'Completed', invoiceNumber: 'INV-2026-0036' },
  { id: 7,  date: '2026-02-01', type: 'Purchase',  description: 'Rotating Proxies — Starter Plan (20 GB)',   amount: 130.00,  paymentMethod: 'Visa ••••4242',      status: 'Completed', invoiceNumber: 'INV-2026-0032' },
  { id: 8,  date: '2026-01-25', type: 'Recharge',  description: 'Account balance top-up',                    amount: 100.00,  paymentMethod: 'PayPal',             status: 'Completed', invoiceNumber: 'INV-2026-0028' },
  { id: 9,  date: '2026-01-18', type: 'Recharge',  description: 'Account balance top-up',                    amount: 50.00,   paymentMethod: 'Mastercard ••••8831', status: 'Pending',   invoiceNumber: null },
  { id: 10, date: '2026-01-10', type: 'Purchase',  description: 'Rotating Proxies — Micro Plan (5 GB)',      amount: 45.00,   paymentMethod: 'Visa ••••4242',      status: 'Failed',    invoiceNumber: null },
]

export const defaultSettings = {
  pendingPasswordChange: null,
  pendingEmailChange: null,
  notificationEmail: '',
  notifications: { billing: true, security: true, updates: false },
}

export const staticIps = [
  '10.0.0.11:8080',
  '10.0.0.12:8080',
  '10.0.0.13:8080',
  '10.0.0.14:8080',
  '10.0.0.15:8080',
  '10.0.1.21:8080',
  '10.0.1.22:8080',
  '10.0.1.23:8080',
  '10.0.1.24:8080',
  '10.0.1.25:8080',
]
