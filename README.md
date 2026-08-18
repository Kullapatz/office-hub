# Office Hub

Act as a Full-Stack Web Developer. Please build a modern, clean, and lightweight Internal HR & Attendance Web Application.

---

### 1. Core Objectives & Roles
- Roles: 
  1. Employee (General staff)
  2. HR / Admin (Manager)
- Design: Clean, intuitive dashboard, responsive for desktop and mobile browsers.

---

### 2. Authentication & Network Security Constraints
- Authentication: Login via Company Email (Domain whitelist e.g., `@company.com` or OAuth 2.0).
- IP Whitelist Restriction:
  - Check-in / Check-out and Login are strictly allowed ONLY when connected to the office network (Matching company Public IP Address / Subnet).
  - If an employee tries to check in from an external IP, show an alert: "Access Denied: You must be connected to the office Wi-Fi/Network."

---

### 3. Key Features

#### A. Time Attendance (Check-in / Check-out)
- One-click "Check In" and "Check Out" buttons.
- Capture exact timestamp and client IP address.
- Real-time status display (e.g., "Checked In at 08:55 AM", "Not checked in today").

#### B. Leave Management & Approval (All-in-One)
- Employee View:
  - Submit leave requests: Sick Leave, Personal Leave, Annual Leave.
  - Form fields: Leave type, Start/End date, Reason, and File upload for attachments (e.g., Medical certificate).
  - Leave History & status tracking (Pending, Approved, Rejected).
- HR / Admin View:
  - Approval dashboard showing all incoming requests with attached files.
  - Actions: 1-Click Approve / Reject with optional comments.

#### C. Company Calendar & Holidays
- Interactive monthly/yearly calendar.
- Displays national holidays, company-specific holidays, and approved team leaves.

#### D. Employee Directory & Quota Tracker (HR Management)
- Employee Directory: List of all employees with Name, Position, Department, Email, and Status.
- HR Actions: Add, Edit, Delete, or Deactivate employee profiles.
- Attendance & Quota Dashboard:
  - Real-time daily log: Check-in/out times.
  - Leave balance overview: Days used vs. Remaining quota (e.g., Sick: 3/30 days, Annual: 2/6 days).

#### E. HR Announcements & Upcoming Events
- Bulletin board widget on the main dashboard.
- HR can publish news, internal memos, and upcoming company activities/events.
- Badge notifications for unread news.

---



---

### 4. Implementation Deliverables
1.html////////////// Theme: refer logo color theme ,white, french blue.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bafa8cc5-786f-4d49-8a44-0be13bd55eb5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
