<#
.SYNOPSIS
  Capture automatisée des écrans NOVIGO (Play Store) via integration_test + flutter drive.

.DESCRIPTION
  Lance l'app sur un appareil/emulateur connecté, pilote la connexion et la
  navigation, et écrit les PNG dans store/play/<app>/images/phoneScreenshots/.
  Nécessite : un appareil Android connecté (`flutter devices`) ET un backend
  démo joignable depuis l'appareil (URL passée à -ApiUrl), avec un compte démo.

.EXAMPLE
  ./take_screenshots.ps1 -App client   -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22370000001" -Otp "123456"
  ./take_screenshots.ps1 -App driver   -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22375000001" -Password "123456"
  ./take_screenshots.ps1 -App merchant -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22376000001" -Password "123456"
#>
param(
  [Parameter(Mandatory = $true)][ValidateSet('client','driver','merchant')][string]$App,
  [string]$ApiUrl = "http://10.0.2.2:8080/api/v1",
  [string]$Phone = "",
  [string]$Password = "123456",
  [string]$Otp = "123456",
  [string]$Device = ""   # ex: emulator-5554 ; vide = appareil par défaut
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $root "malipro_$App"
if (-not (Test-Path $appDir)) { throw "App introuvable : $appDir" }

Push-Location $appDir
try {
  Write-Host "== flutter pub get ($App) ==" -ForegroundColor Cyan
  flutter pub get

  $args = @(
    "drive",
    "--profile",
    "--driver=test_driver/screenshot_driver.dart",
    "--target=integration_test/screenshots_test.dart",
    "--dart-define=API_URL=$ApiUrl",
    "--dart-define=DEMO_PASSWORD=$Password",
    "--dart-define=DEMO_OTP=$Otp"
  )
  if ($Phone) { $args += "--dart-define=DEMO_PHONE=$Phone" }
  if ($Device) { $args += @("-d", $Device) }

  Write-Host "== flutter $($args -join ' ') ==" -ForegroundColor Cyan
  & flutter @args

  $srcDir = Join-Path $appDir "screenshots"
  $dstDir = Join-Path $root "store/play/$App/images/phoneScreenshots"
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
  if (Test-Path $srcDir) {
    Copy-Item "$srcDir/*.png" $dstDir -Force
    $n = (Get-ChildItem "$dstDir/*.png" -ErrorAction SilentlyContinue).Count
    Write-Host "OK — $n capture(s) copiée(s) dans $dstDir" -ForegroundColor Green
  } else {
    Write-Warning "Aucune capture générée (échec de connexion / pas de backend ?)."
  }
}
finally { Pop-Location }
