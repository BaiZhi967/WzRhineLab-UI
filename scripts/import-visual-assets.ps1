<#
.SYNOPSIS
  Import the 8 PNG + 8 WebP + PDF archive into a local WzRhineLab-UI checkout.
.DESCRIPTION
  No automatic push by default. Requires the ZIP delivered with the initial repo setup.
.EXAMPLE
  .\scripts\import-visual-assets.ps1 -AssetZip "$HOME\Downloads\WzRhineLab-UI_concepts_and_research_2026-10-09.zip"
.EXAMPLE
  .\scripts\import-visual-assets.ps1 -AssetZip "C:\Downloads\WzRhineLab-UI_concepts_and_research_2026-10-09.zip" -Commit -Push
#>
param(
  [Parameter(Mandatory=$true)][string]$AssetZip,
  [string]$RepoRoot,
  [switch]$Commit,
  [switch]$Push
)
$ErrorActionPreference = 'Stop'
if ($Push -and -not $Commit) { throw '-Push requires -Commit' }

# Script-scoped paths are not reliably available while PowerShell 5.1
# evaluates parameter defaults. Resolve the repository after binding.
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $scriptFile = $MyInvocation.MyCommand.Path
  if ([string]::IsNullOrWhiteSpace($scriptFile)) {
    throw 'Cannot determine script location. Provide -RepoRoot explicitly.'
  }
  $RepoRoot = Join-Path -Path (Split-Path -Path $scriptFile -Parent) -ChildPath '..'
}
if (-not (Test-Path -LiteralPath $AssetZip -PathType Leaf)) {
  throw "Asset ZIP not found: $AssetZip"
}
$zip = (Resolve-Path -LiteralPath $AssetZip).Path
if (-not (Test-Path -LiteralPath $RepoRoot -PathType Container)) {
  throw "Repository folder not found: $RepoRoot"
}
$repo = (Resolve-Path -LiteralPath $RepoRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
  throw "Not a Git checkout: $repo"
}
$tmp = Join-Path ([IO.Path]::GetTempPath()) ('wzrhine-assets-' + [guid]::NewGuid().ToString('N'))
New-Item -Path $tmp -ItemType Directory -Force | Out-Null
try {
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $manifest = Join-Path $tmp 'SHA256SUMS.txt'
  if (-not (Test-Path $manifest)) { throw 'Missing SHA256SUMS.txt' }
  $expected = @{}
  foreach ($line in Get-Content $manifest -Encoding UTF8) {
    if ($line -match '^([0-9a-f]{64})\s{2}(.+)$') {
      $relative = $Matches[2]
      $expected[$relative] = $Matches[1]
    }
  }
  if ($expected.Count -lt 18) { throw 'Manifest is incomplete' }
  foreach ($kv in $expected.GetEnumerator()) {
    $path = Join-Path $tmp ($kv.Key.Replace('/', [IO.Path]::DirectorySeparatorChar))
    if (-not (Test-Path $path)) { throw "Missing asset: $($kv.Key)" }
    if ((Get-FileHash -Algorithm SHA256 $path).Hash.ToLowerInvariant() -ne $kv.Value) { throw "Checksum failed: $($kv.Key)" }
  }
  $paths = @()
  foreach ($relative in $expected.Keys | Sort-Object) {
    if ($relative -notmatch '^docs/(concepts/images/|research/).*\.(png|webp|pdf)$') { continue }
    $from = Join-Path $tmp ($relative.Replace('/', [IO.Path]::DirectorySeparatorChar))
    $to = Join-Path $repo ($relative.Replace('/', [IO.Path]::DirectorySeparatorChar))
    New-Item -Path (Split-Path $to -Parent) -ItemType Directory -Force | Out-Null
    Copy-Item $from -Destination $to -Force
    $paths += $relative
  }
  if ($paths.Count -ne 17) { throw "Expected 17 binary assets, copied $($paths.Count)" }
  Write-Host "Imported $($paths.Count) assets and verified checksums."
  Push-Location $repo
  try {
    git status --short
    if ($Commit) {
      git add -- docs/concepts/images docs/research/Rhine_Lab_React_Motion_Research_2026-10-09.pdf
      git commit -m '资源：归档概念原图与设计研究报告'
      if ($Push) { git push origin main }
    }
  } finally { Pop-Location }
} finally {
  Remove-Item -Path $tmp -Force -Recurse -ErrorAction SilentlyContinue
}
