---
title: "Using direnv in PowerShell on Windows"
description: "Simple way to manage environment variables in PowerShell on Windows"
date: 2026-02-17T12:50:32+07:00
draft: false
tags:
  - windows
  - dev-setup
---

## `.envrc` files shouldn't be a Linux-only thing.

`direnv` automatically loads and unloads environment variables when you `cd` into or out of a directory. On Linux and macOS it's a first-class tool. On Windows in PowerShell, the [official direnv](https://direnv.net/docs/installation.html) has platform compatibility issues.

So I wrote a drop-in replacement: a PowerShell script that hooks into the prompt, watches for `.envrc` files, and loads or unloads variables automatically — same behavior, no Unix dependency.

---

### Installation

- Save the script below to `$PROFILE\Scripts\direnv.ps1`
- Add `. "$PSScriptRoot\Scripts\direnv.ps1"` to your `$PROFILE`

---

### The Script

```powershell
# PowerShell direnv alternative - Add to $PROFILE

# Global variables to track state
$global:EnvrcLoadedVars = @{}
$global:LastEnvrcPath = $null

function Load-Envrc {
    param (
        [string]$Path
    )

    $envrcFile = Join-Path $Path ".envrc"

    if (Test-Path $envrcFile) {
        # If we're loading the same .envrc, skip
        if ($global:LastEnvrcPath -eq $envrcFile) {
            return
        }

        # Unload previous environment variables
        Unload-Envrc

        Write-Host "direnv: loading $envrcFile" -ForegroundColor Green

        # Read and parse .envrc file
        Get-Content $envrcFile | ForEach-Object {
            $line = $_.Trim()

            # Skip empty lines and comments
            if ($line -eq "" -or $line.StartsWith("#")) {
                return
            }

            # Match export VAR=value or export VAR="value"
            if ($line -match '^export\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$') {
                $varName = $matches[1]
                $varValue = $matches[2]

                # Remove quotes if present
                $varValue = $varValue -replace '^["'']|["'']$', ''

                # Store the original value (if it exists) so we can restore it
                if (Test-Path "env:$varName") {
                    $global:EnvrcLoadedVars[$varName] = @{
                        Original = (Get-Item "env:$varName").Value
                        HasOriginal = $true
                    }
                } else {
                    $global:EnvrcLoadedVars[$varName] = @{
                        Original = $null
                        HasOriginal = $false
                    }
                }

                # Set the environment variable
                Set-Item -Path "env:$varName" -Value $varValue
                Write-Host "  export $varName" -ForegroundColor Gray
            }
        }

        # Track the current .envrc path
        $global:LastEnvrcPath = $envrcFile
    }
    else {
        # No .envrc in current directory, unload if we had one loaded
        if ($global:LastEnvrcPath -ne $null) {
            Unload-Envrc
        }
    }
}

function Unload-Envrc {
    if ($global:EnvrcLoadedVars.Count -gt 0) {
        Write-Host "direnv: unloading" -ForegroundColor Yellow

        foreach ($varName in $global:EnvrcLoadedVars.Keys) {
            $varInfo = $global:EnvrcLoadedVars[$varName]

            if ($varInfo.HasOriginal) {
                # Restore original value
                Set-Item -Path "env:$varName" -Value $varInfo.Original
            } else {
                # Remove the variable as it didn't exist before
                Remove-Item -Path "env:$varName" -ErrorAction SilentlyContinue
            }
        }

        $global:EnvrcLoadedVars = @{}
        $global:LastEnvrcPath = $null
    }
}

# Hook into directory change
$global:LastDirectory = $PWD.Path

function Invoke-EnvrcCheck {
    if ($PWD.Path -ne $global:LastDirectory) {
        $global:LastDirectory = $PWD.Path
        Load-Envrc -Path $PWD.Path
    }
}

# Override the prompt to check for .envrc on every command
$global:OriginalPrompt = $function:prompt

function prompt {
    Invoke-EnvrcCheck
    & $global:OriginalPrompt
}

# Load .envrc in the current directory when profile loads
Load-Envrc -Path $PWD.Path

Write-Host "direnv-like functionality loaded. .envrc files will be auto-loaded/unloaded on directory change." -ForegroundColor Cyan

```
