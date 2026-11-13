# CareCircle progress

Last updated: 2026-11-12
Next deadline: Thursday Nov 19, milestone demo (working front end plus authentication skeleton)

## Milestones

### Done: static front-end
- [x] GitHub repo, README, .gitignore and folder structure (public/, server/, data/)
- [x] Wireframes for every page
- [x] Public landing page (no login needed)
- [x] Login and register pages
- [x] Shared mobile-friendly CSS (plus dark mode with a toggle)

Work days before the demo: Thu Nov 12, Mon Nov 16, probably Tue Nov 17 (busy Fri 13 to Sun 15)

### Today, Thu Nov 12: validation, sample data, dashboard
- [x] Live validation on register and login: email format, password rules
- [x] Sample households.json (4 households, one per plan plus a second Extended one)
- [x] Static household dashboard page HTML (app/dashboard.html: sidebar, header, medications, appointments, household)
- [x] Dashboard CSS (sidebar on computer, bottom bar on phone, sticky mint header, forms)

### Mon Nov 16: interactive dashboard
- [ ] Update households.json with the new fields
- [ ] Lists drawn from sample data with JavaScript
- [ ] Daily medication check-off
- [ ] Data saved in localStorage
- [ ] Free-tier limits shown in the UI

### Tue Nov 17: Flask auth skeleton (Flask lecture Nov 17)
- [ ] Flask server serves the pages
- [ ] Register and login with hashed passwords (skeleton)
- [ ] Short progress demo rehearsed

### Thu Nov 19: Milestone demo, graded 5% (HARD)
- [ ] Working front end plus authentication skeleton

### After the demo (dates to set)
- [ ] Static pages: dependent profile, medications, appointments, doctor card
- [ ] Add/edit/delete forms for dependents, medications, appointments
- [ ] Appointments sorted by date
- [ ] JSON storage module
- [ ] REST routes for households, dependents, medications, appointments
- [ ] Front-end uses fetch instead of localStorage
- [ ] JWT issued at login, protected routes, secret in .env
- [ ] Per-household authorization, tested with two managers
- [ ] Co-manager invite by email
- [ ] Free-tier limits enforced on the server
- [ ] Hosting decided

### Feature freeze (was Nov 20, needs a new date)
- [ ] Server-side validation on every form
- [ ] No crash on bad or missing input
- [ ] User text escaped (XSS)
- [ ] Debug mode off in production
- [ ] Deployed and tested live
- [ ] (If ahead) premium flag and cost split

### By Nov 30: report and demo ready
- [ ] Bugs fixed
- [ ] PDF report (4 to 6 pages) written
- [ ] 2 or 3 slides: product, architecture, hardest problem
- [ ] 8 to 10 minute demo rehearsed (main workflow, one edge case, one security measure)

### Dec 1 to 3: Demo and oral defense, graded 10% (HARD)
- [ ] Demo, presentation and oral defense
- [ ] Git tag "final" pushed (Dec 3)
- [ ] PDF report submitted (Dec 3)

## Current status
In progress: nothing (dashboard HTML and CSS finished)
Blockers: none
Next step: update households.json with the new fields (reason, address, notes, givenBy, givenAt, repeat)
Decision: one dashboard page until the demo; separate pages (doctors, etc.) after
