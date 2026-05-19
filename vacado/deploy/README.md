# Vacado — CI/CD & Ubuntu Hosting

## ⚠️ First: rotate the leaked SSH key

A private key was exposed in chat. **Do not reuse it.** On the server:

```bash
ssh-keygen -t ed25519 -C "vacado-deploy" -f ~/.ssh/vacado_deploy
# add ~/.ssh/vacado_deploy.pub to the server's ~/.ssh/authorized_keys
# remove the old key's line from authorized_keys, then test the new key
```

Use the **new private key** for the `DEPLOY_SSH_KEY` secret below.

## How it works

| Stage | File | What it does |
|-------|------|--------------|
| CI    | `.github/workflows/ci.yml` | On every push/PR: install, `prisma generate`, `tsc --noEmit`, build (backend + frontend). |
| CD    | `.github/workflows/deploy.yml` | After CI passes on `main`: SSH to the server, pull `main`, write `.env` from the `APP_ENV` secret, run `deploy.sh`. |
| Provision | `vacado/deploy/provision-ubuntu.sh` | One-time: installs Docker + Compose + git. Idempotent. |
| Deploy | `vacado/deploy/deploy.sh` | Backs up the existing Vacado DB, builds, starts, health-checks. Non-destructive. |
| Prod stack | `vacado/docker-compose.prod.yml` | Standalone: no public DB ports; app on `${WEB_PORT:-8080}`; restart policies; own volumes. |

## Why this won't wipe your existing server

- It deploys **alongside** whatever is already running. The app binds
  `WEB_PORT` (default **8080**), not `:80`. Postgres/Redis are container-internal
  only — they never bind the host's `:5432`/`:6379`.
- Vacado uses its **own named volumes** (`vacado_pgdata`). Your existing
  database is never read, dropped, or removed.
- `deploy.sh` `pg_dump`s the Vacado DB to `~/vacado-backups/` before each
  deploy and keeps the last 14.
- Nothing here deletes your old app. Retire it **deliberately** only after
  verifying Vacado works (see bottom).

## One-time setup

1. **Provision the server** (as the ssh user, e.g. `ubuntu`):
   ```bash
   curl -fsSL https://raw.githubusercontent.com/shailesh501122/vacadoai/main/vacado/deploy/provision-ubuntu.sh | bash
   newgrp docker
   ```

2. **Add GitHub repo secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |--------|-------|
   | `DEPLOY_HOST` | `161.118.165.248` |
   | `DEPLOY_USER` | `ubuntu` (your ssh user) |
   | `DEPLOY_SSH_KEY` | contents of the **new** `~/.ssh/vacado_deploy` private key |
   | `DEPLOY_PORT` | `22` (optional) |
   | `WEB_PORT` | `8080` (optional) |
   | `APP_ENV` | full production `.env` (see `vacado/.env.example`) — real secrets, never committed |

3. **Trigger a deploy:** push to `main`, or run the **Deploy** workflow manually
   (Actions tab → Deploy → Run workflow).

## Manual deploy (without GitHub Actions)

```bash
git clone https://github.com/shailesh501122/vacadoai.git ~/vacadoai
cd ~/vacadoai/vacado
cp .env.example .env && nano .env        # fill real secrets
WEB_PORT=8080 bash deploy/deploy.sh
```

App: `http://161.118.165.248:8080`

## Put it on :80 / a domain

Point your existing reverse proxy (or a new Nginx/Caddy) at `127.0.0.1:8080`,
add TLS (Let's Encrypt), then expose `:443`. Only after Vacado is verified live
should you stop the old app:

```bash
# inspect first — confirm it's really the old app, then:
pm2 delete <old-app>        # or: docker stop <old> ; systemctl disable --now <old>
pg_dump ... > old-app-final-backup.sql   # back up its data before removing anything
```

I won't run those last destructive steps for you — you should do them by hand
once you've confirmed what's there and taken a backup.
