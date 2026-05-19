#!/usr/bin/env bash
# One-time Ubuntu server prep. Idempotent — safe to re-run.
# Installs Docker Engine + Compose plugin + git. Does NOT touch any
# existing app or database.
#
#   curl -fsSL https://raw.githubusercontent.com/shailesh501122/vacadoai/main/vacado/deploy/provision-ubuntu.sh | bash
set -euo pipefail

echo "==> Updating apt and installing prerequisites"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker Engine"
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
else
  echo "==> Docker already installed: $(docker --version)"
fi

echo "==> Enabling Docker service"
sudo systemctl enable --now docker

# Let the deploy user run docker without sudo (takes effect on next login).
sudo usermod -aG docker "$USER" || true

echo "==> Done. Docker: $(docker --version), Compose: $(docker compose version)"
echo "    Log out/in (or run 'newgrp docker') so the group change applies."
