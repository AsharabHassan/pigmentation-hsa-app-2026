$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot 'public\assets\hsa-cinematic\audio'
$wavPath = Join-Path $outputDir 'voiceover-temp.wav'
$mp3Path = Join-Path $outputDir 'voiceover.mp3'

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 100
$synth.SetOutputToWaveFile($wavPath)

$prompt = New-Object System.Speech.Synthesis.PromptBuilder
$prompt.AppendText('The mirror can show a mark.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(360))
$prompt.AppendText('It cannot show the whole pattern.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(520))
$prompt.AppendText('That is why H S A created the sixty-second Skin-Tone Map.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(420))
$prompt.AppendText('One clear photo becomes a personalised, six-zone view of visible skin-tone variation.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(560))
$prompt.AppendText('Not a diagnosis.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(480))
$prompt.AppendText('A clearer starting point for a conversation with an H S A practitioner.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(420))
$prompt.AppendText('After clinical assessment, the team can discuss a plan shaped around the individual.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(430))
$prompt.AppendText('Better decisions begin with seeing the whole picture.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(500))
$prompt.AppendText('Create your free Skin-Tone Map.')
$prompt.AppendBreak([TimeSpan]::FromMilliseconds(500))
$prompt.AppendText('H S A. See first. Choose better.')

$synth.Speak($prompt)
$synth.Dispose()

Push-Location $projectRoot
try {
  & npx.cmd remotion ffmpeg -loglevel error -y -i $wavPath -ar 48000 -ac 2 -codec:a libmp3lame -b:a 192k $mp3Path
  if ($LASTEXITCODE -ne 0) {
    throw "Voiceover conversion failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}

Write-Output 'Generated temporary voiceover. Replace it with npm run video:voiceover once ElevenLabs credentials are configured.'
