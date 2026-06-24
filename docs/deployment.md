# Deployment

This project has two Soroban contracts:

- `user-registry-contract`: stores the admin address and registered users.
- `feedback-contract`: stores feedback entries and checks the registry contract before accepting feedback.

Deploy the registry first, then the feedback contract.

## Prerequisites

Install:

- Rust with the `wasm32-unknown-unknown` target.
- Stellar CLI.
- A funded Stellar testnet account for deployment.

Rust target:

```sh
rustup target add wasm32-unknown-unknown
```

Check Stellar CLI:

```sh
stellar --version
```

## Wallet Setup

Create or configure a Stellar CLI identity. The scripts expect the identity name in `SOURCE_ACCOUNT`.

Example:

```sh
stellar keys generate deployer --network testnet
stellar keys address deployer
```

Fund the testnet account if needed:

```sh
stellar keys fund deployer --network testnet
```

Set the deployment values:

```sh
export SOURCE_ACCOUNT=deployer
export ADMIN_PUBLIC_KEY=<ADMIN_PUBLIC_KEY>
export STELLAR_NETWORK=testnet
```

PowerShell:

```powershell
$env:SOURCE_ACCOUNT = "deployer"
$env:ADMIN_PUBLIC_KEY = "<ADMIN_PUBLIC_KEY>"
$env:STELLAR_NETWORK = "testnet"
```

`ADMIN_PUBLIC_KEY` should be the public key that will control user registration and feedback review/resolve actions.

## Testnet Deployment

Bash:

```sh
./scripts/deploy-contract.sh
```

PowerShell:

```powershell
.\scripts\deploy-contract.ps1
```

The scripts run this sequence:

1. Build `user-registry-contract`.
2. Build `feedback-contract`.
3. Deploy the registry contract.
4. Deploy the feedback contract.
5. Invoke `initialize(admin)` on the registry contract.
6. Invoke `initialize(admin)` on the feedback contract.

## Manual Stellar CLI Commands

The scripts use these command shapes:

```sh
stellar contract build --manifest-path contract/Cargo.toml --package user-registry-contract
stellar contract build --manifest-path contract/Cargo.toml --package feedback-contract
```

```sh
stellar contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/user_registry_contract.wasm \
  --source "$SOURCE_ACCOUNT" \
  --network testnet
```

```sh
stellar contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/feedback_contract.wasm \
  --source "$SOURCE_ACCOUNT" \
  --network testnet
```

```sh
stellar contract invoke \
  --id "$VITE_USER_REGISTRY_CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet \
  -- initialize \
  --admin "$ADMIN_PUBLIC_KEY"
```

```sh
stellar contract invoke \
  --id "$VITE_FEEDBACK_CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet \
  -- initialize \
  --admin "$ADMIN_PUBLIC_KEY"
```

## Environment Variables

After deployment, copy the printed contract IDs into `frontend/.env.local`.

```env
VITE_FEEDBACK_CONTRACT_ID=<DEPLOYED_FEEDBACK_CONTRACT_ID>
VITE_USER_REGISTRY_CONTRACT_ID=<DEPLOYED_USER_REGISTRY_CONTRACT_ID>
VITE_STELLAR_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_ADMIN_PUBLIC_KEY=<ADMIN_PUBLIC_KEY>
```

Frontend meaning:

- `VITE_FEEDBACK_CONTRACT_ID`: deployed feedback contract ID.
- `VITE_USER_REGISTRY_CONTRACT_ID`: deployed user registry contract ID.
- `VITE_STELLAR_NETWORK`: network label used by the frontend, usually `testnet`.
- `VITE_RPC_URL`: Soroban RPC endpoint.
- `VITE_ADMIN_PUBLIC_KEY`: public key allowed to use admin UI actions.

Deployment script meaning:

- `SOURCE_ACCOUNT`: Stellar CLI identity used to sign deployment and initialization transactions.
- `ADMIN_PUBLIC_KEY`: public key stored as admin in both contracts.
- `STELLAR_NETWORK`: Stellar CLI network name, default `testnet`.

## Contract IDs

The scripts print both deployed contract IDs at the end:

```env
VITE_FEEDBACK_CONTRACT_ID=...
VITE_USER_REGISTRY_CONTRACT_ID=...
```

Do not use placeholder or fake contract IDs. The frontend intentionally fails with a configuration error if contract IDs are missing.
