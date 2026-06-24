#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_DIR="$ROOT_DIR/contract"
TARGET_DIR="$CONTRACT_DIR/target/wasm32-unknown-unknown/release"

SOURCE_ACCOUNT="${SOURCE_ACCOUNT:-}"
ADMIN_PUBLIC_KEY="${ADMIN_PUBLIC_KEY:-}"
STELLAR_NETWORK="${STELLAR_NETWORK:-testnet}"

REGISTRY_PACKAGE="user-registry-contract"
FEEDBACK_PACKAGE="feedback-contract"
REGISTRY_WASM="$TARGET_DIR/user_registry_contract.wasm"
FEEDBACK_WASM="$TARGET_DIR/feedback_contract.wasm"

require_value() {
  local name="$1"
  local value="$2"

  if [[ -z "$value" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_value "SOURCE_ACCOUNT" "$SOURCE_ACCOUNT"
require_value "ADMIN_PUBLIC_KEY" "$ADMIN_PUBLIC_KEY"
require_command "stellar"

echo "Building registry contract..."
stellar contract build \
  --manifest-path "$CONTRACT_DIR/Cargo.toml" \
  --package "$REGISTRY_PACKAGE"

echo "Building feedback contract..."
stellar contract build \
  --manifest-path "$CONTRACT_DIR/Cargo.toml" \
  --package "$FEEDBACK_PACKAGE"

echo "Deploying registry contract to $STELLAR_NETWORK..."
USER_REGISTRY_CONTRACT_ID="$(
  stellar contract deploy \
    --wasm "$REGISTRY_WASM" \
    --source "$SOURCE_ACCOUNT" \
    --network "$STELLAR_NETWORK"
)"

echo "Deploying feedback contract to $STELLAR_NETWORK..."
FEEDBACK_CONTRACT_ID="$(
  stellar contract deploy \
    --wasm "$FEEDBACK_WASM" \
    --source "$SOURCE_ACCOUNT" \
    --network "$STELLAR_NETWORK"
)"

echo "Initializing registry admin..."
stellar contract invoke \
  --id "$USER_REGISTRY_CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBLIC_KEY"

echo "Initializing feedback admin..."
stellar contract invoke \
  --id "$FEEDBACK_CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBLIC_KEY"

cat <<EOF

Deployment complete.

Use these frontend environment variables:

VITE_FEEDBACK_CONTRACT_ID=$FEEDBACK_CONTRACT_ID
VITE_USER_REGISTRY_CONTRACT_ID=$USER_REGISTRY_CONTRACT_ID
VITE_STELLAR_NETWORK=$STELLAR_NETWORK
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_ADMIN_PUBLIC_KEY=$ADMIN_PUBLIC_KEY
EOF
