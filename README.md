# CareerConnect - Job Portal (React + Django REST + MySQL)

మూడు రోల్స్ (Job Seeker, Recruiter, Admin) ఉన్న పూర్తి జాబ్ పోర్టల్.
A full-stack job portal with three roles: Job Seeker, Recruiter, Admin.

## 1. Folder structure

```
careerconnect/
├── backend/                  Django + DRF API
│   ├── careerconnect/        project config (settings, root urls, error handler)
│   ├── accounts/             User (with role), profiles, JWT auth, permissions, admin stats
│   ├── companies/            Company + RecruiterCompany
│   ├── jobs/                 Job, SavedJob, search filters
│   ├── applications/         Application, status history, resume download
│   ├── requirements.txt  .env.example  Procfile
├── frontend/                 React app
│   └── src/ api/ context/ components/ pages/ styles/
├── CareerConnect.postman_collection.json
└── .gitignore
```

**Why split into apps? / ఎందుకు apps గా విడదీశాం?**
Each app owns one responsibility (users, companies, jobs, applications), so code stays small, testable and easy to find.
ప్రతి app ఒక్క పనికి బాధ్యత వహిస్తుంది - కోడ్ చిన్నదిగా, సులభంగా కనుగొనేలా ఉంటుంది.

## 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit DB_PASSWORD, SECRET_KEY
```

Create the MySQL database first:

```sql
CREATE DATABASE careerconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
python manage.py migrate
python manage.py create_admin     # creates an admin with role='admin'
python manage.py runserver        # http://localhost:8000
```

Note: `mysqlclient` needs system libraries. Ubuntu: `sudo apt install libmysqlclient-dev pkg-config`. macOS: `brew install mysql pkg-config`. Windows: use a prebuilt wheel or `pip install mysqlclient` with the MySQL connector installed.

**Why `create_admin` and not `createsuperuser`?** Django's command doesn't know our `role` field, so that user would be a job seeker and every admin endpoint would reject them.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm start                         # http://localhost:3000
```

## 4. Database relationships

| Relationship | Meaning |
|---|---|
| User 1-1 JobSeekerProfile / RecruiterProfile | account data vs role-specific data |
| Company 1-N Job | a company has many jobs |
| User (recruiter) 1-N Job | who posted it |
| Job 1-N Application, User (seeker) 1-N Application | unique (job, seeker) - no double apply |
| Application 1-N ApplicationStatusHistory | audit trail of status changes |
| User N-M Job via SavedJob | bookmarks, unique (seeker, job) |

## 5. API reference

| Method | URL | Who |
|---|---|---|
| POST | /api/auth/register/ , /api/auth/login/ , /api/auth/login/refresh/ | public |
| GET | /api/auth/me/ | any logged in |
| GET/PATCH | /api/auth/profile/jobseeker/ (multipart, resume) | seeker |
| GET/POST | /api/companies/ | list: any, create: recruiter |
| PATCH/DELETE | /api/companies/<id>/ | owner recruiter |
| GET | /api/jobs/?location=&skills=&min_salary=&max_salary=&job_type=&title=&search= | public |
| POST | /api/jobs/ | recruiter |
| GET/PATCH/DELETE | /api/jobs/<id>/ | GET public, others owner recruiter |
| GET | /api/jobs/mine/ | recruiter |
| GET/POST, DELETE | /api/jobs/saved/ , /api/jobs/saved/<id>/ | seeker |
| POST | /api/applications/apply/ (multipart) | seeker |
| GET | /api/applications/mine/ | seeker |
| GET | /api/applications/job/<job_id>/applicants/ | job's recruiter |
| PATCH | /api/applications/<id>/status/ | job's recruiter |
| GET | /api/applications/<id>/resume/ | recruiter of the job or applicant |
| GET | /api/auth/admin/dashboard/ , /api/auth/admin/users/ | admin |
| PATCH | /api/auth/admin/users/<id>/toggle-active/ | admin |
| GET/DELETE | /api/jobs/admin/all/ , /api/jobs/admin/<id>/ | admin |
| DELETE | /api/companies/admin/<id>/ | admin |
| GET | /api/applications/admin/all/ | admin |

Status values: `applied, under_review, shortlisted, interview, selected, rejected`.

## 6. Why each part exists (beginner notes)

- **Custom User with `role`**: one login system for all three user types.
- **JWT (SimpleJWT)**: the server stays stateless; React stores an access token (60 min) and a refresh token (7 days). The Axios interceptor refreshes silently.
- **Serializers**: convert models to JSON and validate incoming data.
- **Permissions**: `IsJobSeeker`, `IsRecruiter`, `IsAdminRole` decide who may call an endpoint; `IsOwnerOrReadOnly` stops a recruiter editing someone else's job.
- **`get_queryset()` scoping**: views only return rows the user owns, so guessing IDs in the URL doesn't leak data.
- **FileField + MEDIA_ROOT**: stores uploaded resumes; each application keeps its own resume copy.
- **CORS**: lets the React dev server (port 3000) call the API (port 8000).
- **Central error handler**: every error returns `{error, details}`, so React shows messages in one consistent way.
- **AuthContext + ProtectedRoute**: React knows the role and blocks pages the role shouldn't see.

## 7. Postman testing

1. Import `CareerConnect.postman_collection.json`.
2. Run requests 1-4 in order (login requests save tokens automatically).
3. Run 5-13. For request 8, pick a PDF in the `resume` form-data field.
4. Try a wrong-role call (seeker posting a job) - expect **403**. Apply twice - expect **400**.

## 8. GitHub setup

```bash
cd careerconnect
git init
git add .
git commit -m "Initial commit: CareerConnect"
git branch -M main
git remote add origin https://github.com/<you>/careerconnect.git
git push -u origin main
```
Never commit `.env` (already in `.gitignore`).

## 9. Deployment

**Backend (Render / Railway / any VPS)**
1. Provision a MySQL database; set env vars: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=<your-domain>`, `DB_*`, `CORS_ALLOWED_ORIGINS=https://<frontend-domain>`.
2. Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`.
3. Start: `gunicorn careerconnect.wsgi`.
4. Uploaded resumes: platform disks can be wiped on redeploy. Attach a persistent disk at `MEDIA_ROOT`, or move to S3 (django-storages) before real use. Also serve `/media/` through your web server or storage, since Django only serves it when `DEBUG=True`.

**Frontend (Vercel / Netlify)**
1. Set `REACT_APP_API_BASE_URL=https://<backend-domain>/api`.
2. Build command `npm run build`, output folder `build`.
3. Add a rewrite of all paths to `/index.html` so React Router deep links work.

## 10. Known scope limits

Skills are stored as comma-separated text (simple filtering, not a normalized Skill table); no email notifications; resume storage is local disk by default; no automated test suite beyond the manual API flow in the Postman collection.
