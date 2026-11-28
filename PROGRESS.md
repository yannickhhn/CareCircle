# CareCircle progress

Last updated: 2026-11-21
Next deadline: Backend 2/4, Thu Nov 26 (login and authorization)

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
- Skipped: localStorage (the Flask back end saves changes instead, see Backend 3/4)
- [x] Back end plan (written) and demo rehearsal (done Nov 17)

### Tue Nov 17: finish the front end
- [x] Every button and form on the dashboard works (front end only)
- Moved after the demo: medication duration and quantity (not needed for the milestone, see "Cut unless time is left")
- [x] Back end skeleton: written plan of how the server, storage and login would work (BACKEND_PLAN.md)
- [x] Short progress demo rehearsed

### Tue Nov 17, 6 pm: Milestone, graded 5% (HARD, moved up from Nov 19)
- [x] Fully functional front end plus back end skeleton (plan): 3/3

## After the demo: back end plan (Python with Flask)

### Backend 1/4, Mon Nov 23: server and reading data
- [x] Flask set up (venv, requirements.txt)
- [x] Server opens the site at localhost:5000
- [x] JSON storage module (read and write)
- [x] Route: one household with its data
- [x] Route: a manager's households (temporary, until login)
- [x] Dashboard uses fetch instead of reading the JSON files

### Backend 2/4, Thu Nov 26: login and authorization
- [x] Secret key in .env, loaded by app.py (server stops if it's missing)
- [x] Register route on the server (POST /api/register: checks every field, refuses a used email, saves only the hash)
- [x] Register form sends to the server (auth.js), with matching maxlength in the HTML
- [x] Login and logout routes on the server (session cookie, 8-hour limit, clear error messages)
- [x] Login form and Log out button send to the server
- [x] Logged-in manager replaces the hard-coded Anna (m5): /api/me, 401 sends you to login
- [x] Create a household (moved up from Backend 3/4): one per person unless Extended, checked on the server
- Skipped: demo passwords for the sample managers (I register my own test accounts instead)
- [x] A manager only gets their own households (403 otherwise): is_member() in get_household
- [ ] Test: manager A can't read manager B's household (moved to the live demo; server check already tested with Mark: own h1 200, Rose's h4 403, h99 404)
  - How: register A, create Household A, log out. Register B, create Household B.
  - As B, open localhost:5000/api/households/<A's id> (see data/households.json, likely h5)
  - Expect: {"error": "You don't have access to this household"} (403). Screenshot it for the report

### Backend 3/4, Sat Nov 28: saving changes
- [x] Shared check helper load_my_household (401 logged out, 404 unknown, 403 not a member), used by get_household
- [x] Medications: add and delete saved on the server, optional end date (ended ones are hidden)
- [x] Dependents: add, edit, remove saved on the server; member limit on the server; remove is blocked while they still have medications, appointments or doctors
- [x] Medications can have 1 to 4 times a day (one row shows the next dose, "2 of 3 today"); medications.json converted to times + given log
- [x] Appointments: add and delete saved on the server (date from today on, notes split by line on the server); Delete buttons shown
- [x] Doctors: add and delete saved on the server (phone and optional email checked); Delete button added to the cards
- [ ] Add, edit and delete: medications, appointments, doctors, dependents
- [x] Med check-off saved (given log on the server, "by" from the session, 409 if another manager already gave that dose, undo the last dose)
- [x] Invite a co-manager by email: an existing account is added now; otherwise the email is kept as a pending invite and joins when they register (pending invites count toward the limit)
- [x] Free-tier limits checked on the server (built into every route)
- [x] Server repeats every form check (bad input gets an error, not a crash) (built into every route)

### Settings page (after Backend 3/4, before Dec 1)
- [ ] Change the household name
- [ ] Change my first name
- [ ] Change my password (asks for the current one first)
- [ ] Leave a household (decide: what happens if the last manager leaves?)

### Backend 4/4, Tue Dec 1: feature freeze
- [ ] User text safe from XSS
- [ ] Debug mode off
- [x] Hosting decided (Nov 26): deployment not required; demo runs the Flask server locally (JSON files on disk). GitHub Pages can't run Flask.
- [x] Demo runs on my laptop (localhost), confirmed Nov 26
- [ ] Bonus (optional): deploy on Oracle Cloud (always-on server with a disk, so JSON files are kept). Launching earns a bonus point. Only after Backend 3/4 works; the laptop demo stays the backup
- [ ] README run instructions
- [ ] Demo rehearsed, no slides needed (main workflow, one edge case, one security measure: the step 7 test above)

### Dec 1 to 3: Demo and oral defense, graded 10% (HARD)
- [ ] Demo, presentation and oral defense

### Dec 3: Code freeze (HARD)
- [ ] Bugs fixed
- [ ] Git tag "final" pushed
- [ ] PDF report (4 to 6 pages) submitted

### Cut unless time is left
- Separate pages (dependent profile, medications, appointments, doctor card)
- Medication dose count (chose an end date instead, Nov 27)
- Premium flag and cost split (changing plan, no real payment)
- "New household" option for Extended managers (the server already allows it; needs the premium flag first, since every new household starts on Economic)

## Current status
In progress: nothing
Blockers: none
Next step: Backend 2/4 step 7, test two accounts I register (A can't open B's household), then Backend 3/4 (Sat Nov 28)
Decision: one dashboard page for the final version; separate pages only if time is left
Decision (Nov 26): login uses Flask's session cookie
