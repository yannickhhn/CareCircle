# CareCircle

CareCircle is a web app that helps caregivers coordinate health care for the people they look after. Caregivers who share the work, such as siblings caring for a parent, can see the same medications, appointments and doctor contacts in one place.

**Author**: Yannick Hantaniaina.

## Goal

Keeping track of a family member's care often gets split across text messages, paper notes and memory. CareCircle gives every caregiver in a household the same up-to-date view, so no one misses a dose or an appointment.

## How it works

- A **household** is a shared space for one family's care.
- **Managers** are the caregivers. Each manager has their own login, a household can have several managers, and one manager can belong to several households.
- **Dependents** are the people being cared for. For each dependent, managers track:
  - medications, with a daily check-off
  - appointments, sorted with the next one first
  - a doctor contact card
- Each household's data is private: managers only see the households they belong to.
- **Free tier:** 1 household per person and up to 4 members per household (managers plus dependents).

## Tech stack

| Layer | Technology |
| --- | --- |
| Front end | HTML5, CSS3, vanilla JavaScript (no frameworks) |
| Back end | Python Flask |
| Data | JSON files on disk |
| Authentication (planned) | JWT, with hashed passwords |

## Front end

Pages being built:

| Page | Purpose |
| --- | --- |
| Landing | Public page explaining CareCircle, with links to sign up and log in |
| Register | Create a manager account |
| Login | Sign in to an existing account |
| Household dashboard | Overview of the household's managers and dependents |
| Medications | Medication list with a daily check-off |
| Appointments | Upcoming appointments, nearest date first |
| Doctor card | Contact details for a dependent's doctor |

All pages share one stylesheet and are designed to work at phone width.

## How to run

1. Install Python 3.11 or newer.
2. In the project folder, create and turn on a virtual environment:
   ```
   python -m venv venv
   .\venv\Scripts\Activate.ps1        (Windows PowerShell)
   source venv/bin/activate           (Mac or Linux)
   ```
3. Install the packages:
   ```
   pip install -r requirements.txt
   ```
4. Start the server:
   ```
   python server/app.py
   ```
5. Open http://localhost:5000

## Project status

Front end done. Back end in progress: the Flask server serves the pages and the household data. Login and saving changes come next.
