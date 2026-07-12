# Recadre des captures d'écran émulateur (1080x2400) au format Play Store 1080x2160 (ratio 2:1).
# Retire la barre de statut (haut) et la zone de gestes (bas), garde l'en-tête app + la bottom-nav.
# Usage : crop_play.ps1 -Src <dossier raw> -Dst <dossier sortie> -Map "rawname=NN,..."
param(
  [Parameter(Mandatory=$true)][string]$Src,
  [Parameter(Mandatory=$true)][string]$Dst,
  [Parameter(Mandatory=$true)][string]$Map,   # ex: "01-home=01,03-home3=02"
  [int]$Top = 120,
  [int]$OutW = 1080,
  [int]$OutH = 2160
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Dst | Out-Null
foreach ($pair in $Map.Split(",")) {
  $k,$v = $pair.Split("=")
  $inPath = Join-Path $Src "$k.png"
  if (-not (Test-Path $inPath)) { Write-Output "SKIP (missing): $inPath"; continue }
  $img = [System.Drawing.Image]::FromFile($inPath)
  $rect = New-Object System.Drawing.Rectangle(0, $Top, $OutW, $OutH)
  $bmp = New-Object System.Drawing.Bitmap($OutW, $OutH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$OutW,$OutH)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $outPath = Join-Path $Dst "$v.png"
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Output "wrote $outPath ($OutW x $OutH)"
}
