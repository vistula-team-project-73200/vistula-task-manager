# Vistula Task Manager

A simple task manager (HTML + JavaScript) that stores tasks in Supabase through the Supabase REST API.
It is hosted on GitHub Pages.

## REST API calls used (`app.js`)

| Method | Endpoint | Used for |
|--------|----------|----------|
| GET | `/tasks?select=*` | List all tasks |
| GET | `/tasks?id=eq.{id}&select=*` | Load one task before editing it |
| POST | `/tasks` | Create a task |
| PUT | `/tasks?id=eq.{id}` | Save a full task (edit / toggle completed) |
| DELETE | `/tasks?id=eq.{id}` | Delete a task |

## Setup

1. Create a **separate demo** Supabase project. Open the SQL Editor and run `supabase-setup.sql`.
   That creates the `tasks` table, turns on RLS, adds public CRUD policies and inserts sample rows.
2. In **Project Settings → API**, copy the Project URL and the **publishable** key into `config.json`.
   Never put the secret or service_role key into this repo.
3. Push to a GitHub repo named `vistula-task-manager` and turn on **Settings → Pages → Deploy from branch → main / root**.

## Running locally

`fetch('config.json')` does not work over `file://`,Contribution by student 73549 so serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Team contribution

`contribution.html` and `contribution.json` are added to this repo by a partner's Pull Request.


Contribution by student 73549-Emil Real Madrid