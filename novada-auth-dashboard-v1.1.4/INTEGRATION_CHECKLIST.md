# Integration Checklist

## High priority

- [x] Unified login -> auth cookie -> dashboard redirect chain
- [x] Dashboard entry `/app/` verifies session before loading UI
- [x] Root route redirects to login
- [x] Backend serves auth pages + dashboard from one origin
- [x] MySQL auth schema included
- [x] Frontend source updated so future builds preserve auth check

## Medium priority

- [x] Vite dev proxy added for `/api`
- [x] Auth pages re-linked to the integrated routes
- [x] Optional DB extension file added for future dashboard persistence
- [x] Deployment and integration guide added

## Low priority / future work

- [ ] Replace dashboard mock data with real CRUD APIs
- [ ] Move proxy users / whitelist to MySQL tables
- [ ] Add role / permission layers
- [ ] Add password reset and email verification
- [ ] Replace placeholder Google login with real OAuth
