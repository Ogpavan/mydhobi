#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

deploy_host="${MYDHOBI_DEPLOY_HOST:-myserver}"
remote_root="${MYDHOBI_REMOTE_ROOT:-/var/www/mydhobi-react-node}"
remote_service="${MYDHOBI_REMOTE_SERVICE:-mydhobi.service}"
release_id="${MYDHOBI_RELEASE_ID:-$(date -u +%Y%m%d-%H%M%S)}"
remote_release="$remote_root/releases/$release_id"
ssh_options=(-o BatchMode=yes -o ConnectTimeout=15)

for command_name in npm rsync ssh; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
done

echo "Running tests..."
npm test
echo "Building the application..."
npm run build

echo "Preparing release $release_id on $deploy_host..."
ssh "${ssh_options[@]}" "$deploy_host" bash -s -- \
  "$remote_root" "$remote_release" "$remote_service" <<'REMOTE_PREPARE'
set -Eeuo pipefail
remote_root="$1"
remote_release="$2"

test -f "$remote_root/current/.env" || {
  echo "Missing production environment: $remote_root/current/.env" >&2
  exit 1
}
install -d -o root -g www-data "$remote_root/releases"
cp -al "$remote_root/current/." "$remote_release"
rm -f "$remote_release/.env"
install -m 0640 -o root -g www-data \
  "$remote_root/current/.env" "$remote_release/.env"
REMOTE_PREPARE

rsync -acz --relative \
  package.json \
  package-lock.json \
  tsconfig.base.json \
  apps/api/dist/server.js \
  apps/api/package.json \
  apps/api/tsconfig.json \
  apps/api/src \
  apps/web/dist \
  apps/web/package.json \
  packages/domain/package.json \
  packages/domain/src \
  "$deploy_host:$remote_release/"

echo "Installing production dependencies and running migrations..."
ssh "${ssh_options[@]}" "$deploy_host" bash -s -- \
  "$remote_root" "$remote_release" "$remote_service" <<'REMOTE_DEPLOY'
set -Eeuo pipefail
remote_root="$1"
remote_release="$2"
remote_service="$3"
previous_release="$(readlink -f "$remote_root/current" 2>/dev/null || true)"

cd "$remote_release"
npm ci --include=dev --ignore-scripts
npm run db:migrate
npm prune --omit=dev --ignore-scripts

ln -sfn "$remote_release" "$remote_root/current.next"
mv -Tf "$remote_root/current.next" "$remote_root/current"
systemctl restart "$remote_service"

port="$(awk -F= '$1 ~ /^[[:space:]]*PORT[[:space:]]*$/ { print $2; exit }' .env | tr -d "[:space:]'\"")"
if [[ ! "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
  port=4000
fi
healthy=false
for attempt in $(seq 1 20); do
  if curl --fail --silent --show-error "http://127.0.0.1:$port/api/health" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != true ]]; then
  echo "MyDhobi health check failed; restoring the previous release." >&2
  if [[ -n "$previous_release" && -d "$previous_release" ]]; then
    ln -sfn "$previous_release" "$remote_root/current.rollback"
    mv -Tf "$remote_root/current.rollback" "$remote_root/current"
    systemctl restart "$remote_service"
  fi
  exit 1
fi

systemctl is-active --quiet "$remote_service"
echo "Deployed $remote_release"
REMOTE_DEPLOY

echo "Deployment completed successfully."
