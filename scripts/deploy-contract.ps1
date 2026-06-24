param(
  [string]$SourceAccount = $env:SOURCE_ACCOUNT,
  [string]$AdminPublicKey = $env:ADMIN_PUBLIC_KEY,
  [string]$StellarNetwork = $(if ($env:STELLAR_NETWORK) { $env:STELLAR_NETWORK } else { "testnet" })
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$ContractDir = Join-Path $RootDir "contract"
$TargetDir = Join-Path $ContractDir "target\wasm32-unknown-unknown\release"

$RegistryPackage = "user-registry-contract"
$FeedbackPackage = "feedback-contract"
$RegistryWasm = Join-Path $TargetDir "user_registry_contract.wasm"
$FeedbackWasm = Join-Path $TargetDir "feedback_contract.wasm"

function Assert-Value {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing required environment variable or parameter: $Name"
  }
}

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Assert-Value -Name "SOURCE_ACCOUNT" -Value $SourceAccount
Assert-Value -Name "ADMIN_PUBLIC_KEY" -Value $AdminPublicKey
Assert-Command -Name "stellar"

Write-Host "Building registry contract..."
stellar contract build `
  --manifest-path "$ContractDir\Cargo.toml" `
  --package $RegistryPackage

Write-Host "Building feedback contract..."
stellar contract build `
  --manifest-path "$ContractDir\Cargo.toml" `
  --package $FeedbackPackage

Write-Host "Deploying registry contract to $StellarNetwork..."
$UserRegistryContractId = (stellar contract deploy `
  --wasm $RegistryWasm `
  --source $SourceAccount `
  --network $StellarNetwork).Trim()

Write-Host "Deploying feedback contract to $StellarNetwork..."
$FeedbackContractId = (stellar contract deploy `
  --wasm $FeedbackWasm `
  --source $SourceAccount `
  --network $StellarNetwork).Trim()

Write-Host "Initializing registry admin..."
stellar contract invoke `
  --id $UserRegistryContractId `
  --source $SourceAccount `
  --network $StellarNetwork `
  -- initialize `
  --admin $AdminPublicKey

Write-Host "Initializing feedback admin..."
stellar contract invoke `
  --id $FeedbackContractId `
  --source $SourceAccount `
  --network $StellarNetwork `
  -- initialize `
  --admin $AdminPublicKey

Write-Host ""
Write-Host "Deployment complete."
Write-Host ""
Write-Host "Use these frontend environment variables:"
Write-Host ""
Write-Host "VITE_FEEDBACK_CONTRACT_ID=$FeedbackContractId"
Write-Host "VITE_USER_REGISTRY_CONTRACT_ID=$UserRegistryContractId"
Write-Host "VITE_STELLAR_NETWORK=$StellarNetwork"
Write-Host "VITE_RPC_URL=https://soroban-testnet.stellar.org"
Write-Host "VITE_ADMIN_PUBLIC_KEY=$AdminPublicKey"
