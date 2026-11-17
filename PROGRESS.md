# CareCircle progress

Last updated: 2026-11-16
Next deadline: Tuesday Nov 17, 6 pm, milestone (working front end plus authentication skeleton). Moved up from Nov 19.

Plan for the short deadline:
- Mon Nov 16: lists from the JSON, med check-off, medication Add form with validation
- Tue Nov 17 (before 6 pm): finish the front end (every button and form works), write the back end plan, quick rehearsal

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
- [x] Split data into managers, households, medications, appointments, doctors JSON files (linked by ids)
- [x] Comments cleaned up in every HTML, CSS and JS file (section labels plus short notes on tricky logic)
- [x] Lists drawn from sample data with JavaScript (header, medications, appointments, household)
- [x] Daily medication check-off (in memory until saving exists)
- [x] Appointments: Upcoming and Overdue (past ones stay until deleted), no Completed section
- [x] Medication Add form with validation (dropdown from the household, required, max length, time format, dependent must belong to the household)
- [x] Phone layout fixed (top strip with logo and settings, bottom bar with sections; settings at the bottom of the sidebar on computer)
- [x] (+) buttons open the Add forms as pop-ups on phone (medications, appointments, household)
- [x] Appointment form, dependent Add and Edit, invite a co-manager (shared validation)
- [x] Free-tier limit: message only when adding a dependent or inviting into a full household (Economic 4, Familial 8, Extended unlimited)
- [x] Delete and Remove buttons hidden until saving exists
- [x] Doctor cards section (last on the page) with an Add doctor form
- [x] Household dropdown for managers in several households (current manager: Anna, m5; ?household= ignored if not hers)
- [ ] localStorage skipped for now: changes are lost on reload or when switching household
- [ ] Still to do: back end plan (written), demo rehearsal

### Tue Nov 17: finish the front end
- [ ] Every button and form on the dashboard works (front end only)
- [ ] Back end skeleton: written plan of how the server, storage and login would work (no Flask code yet, Flask not taught)
- [ ] Short progress demo rehearsed

### Tue Nov 17, 6 pm: Milestone, graded 5% (HARD, moved up from Nov 19)
- [ ] Fully functional front end plus back end skeleton (plan)

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
Next step: dashboard JavaScript (lists from the JSON files, check-off, Add forms, free-tier limit). Needs Live Server to read JSON
Decision: one dashboard page until the demo; separate pages (doctors, etc.) after
