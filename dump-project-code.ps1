# dump-project-code-final.ps1
# Robust recursive project code dumper with skip log (cache-related skips suppressed).
# Paste into a file and run from PowerShell:  .\dump-project-code-final.ps1

# --- Configuration ---
# Resolve script directory robustly so script works when run via -File, from VS Code, or when pasted
if ($PSScriptRoot -and $PSScriptRoot.Trim() -ne '') {
    $scriptDir = $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
    $scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
} else {
    $scriptDir = (Get-Location).Path
}

# Use script directory as default root; change if you want a different root
$rootPath      = $scriptDir
$outputFile    = Join-Path -Path $scriptDir -ChildPath 'project-code-dump.txt'
$skipLogFile   = Join-Path -Path $scriptDir -ChildPath 'skipped-files.txt'
$maxSizeBytes  = 0                # 0 = no size limit; set to e.g. 5MB to enable size-based skipping
$outEncoding   = 'utf8'        # BOM helps Notepad display Unicode box-drawing correctly

# Folders to exclude entirely (names only)
$excludeDirs = @(
    'node_modules', '.git', '.vscode', 'venv', 'env',
    '__pycache__', '.pytest_cache', 'cache', 'dist', 'build',
    'coverage', '.next', '.nuxt', 'out', 'public', 'static'
)

# File patterns to include
$includeExtensions = @(
    '*.js','*.mjs','*.jsx','*.ts','*.tsx',
    '*.vue','*.css','*.scss','*.sass','*.less',
    '*.html','*.htm',
    '*.py','*.cs','*.cshtml',
    '*.java','*.go','*.php','*.rb','*.rs',
    '*.cpp','*.h','*.hpp',
    '*.json','*.yaml','*.yml',
    '*.md','README*','Dockerfile','*.dockerignore',
    '.env*','*.config.js','*.config.ts'
)

# --- Prepare output files safely ---
try {
    if (Test-Path $outputFile) { Remove-Item $outputFile -Force -ErrorAction Stop }
    if (Test-Path $skipLogFile) { Remove-Item $skipLogFile -Force -ErrorAction Stop }
    New-Item -Path $outputFile -ItemType File -Force | Out-Null
    New-Item -Path $skipLogFile -ItemType File -Force | Out-Null
} catch {
    Write-Error "Cannot create output files in '$scriptDir': $($_.Exception.Message)"
    exit 1
}

Write-Host "Root path: $rootPath"
Write-Host "Output file: $outputFile"
Write-Host "Skip log file: $skipLogFile`n"

# Helper: compute relative path
function Get-RelativePath {
    param($basePath, $fullPath)
    $baseFull = (Get-Item $basePath).FullName.TrimEnd('\','/')
    $f = $fullPath
    if ($f.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $f.Substring($baseFull.Length).TrimStart('\','/')
    }
    return $f
}

# --- Collect candidates ---
# Bulletproof file collection - handles all PowerShell versions
$allCandidates = @()
foreach ($ext in $includeExtensions) {
    try {
        $found = Get-ChildItem -Path $rootPath -Recurse -File -Filter $ext -Force -ErrorAction SilentlyContinue
        $allCandidates += $found
    } catch {
        # Silent fail per pattern
    }
}
$allCandidates = $allCandidates | Sort-Object FullName -Unique


# Normalize to array
$allCandidates = @($allCandidates)

$files = @()
$skipped = @()

foreach ($item in $allCandidates) {
    # Skip if any ancestor folder matches exclude list
    $pathParts = $item.FullName.Split([char[]]@('\','/'), [StringSplitOptions]::RemoveEmptyEntries)
    $excluded = $false
    $excludedReason = $null
    $suppressListing = $false

    foreach ($part in $pathParts) {
        if ($excludeDirs -contains $part) {
            $excluded = $true
            $excludedReason = "ExcludedDir:$part"
            if ($part -match 'cache') { $suppressListing = $true }
            break
        }
    }

    if ($excluded) {
        if (-not $suppressListing) {
            $skipped += [PSCustomObject]@{ Path = $item.FullName; Reason = $excludedReason }
        }
        continue
    }

    # Size-based skipping (optional)
    if ($maxSizeBytes -gt 0 -and $item.Length -gt $maxSizeBytes) {
        $skipped += [PSCustomObject]@{ Path = $item.FullName; Reason = "TooLarge:$($item.Length) bytes" }
        continue
    }

    $files += $item
}

$fileCount = ($files | Measure-Object).Count

if ($fileCount -eq 0) {
    Write-Warning "No matching files found. Check include patterns or folder structure."
    $skippedToList = $skipped | Where-Object { $_.Reason -notmatch 'cache' -and $_.Path -notmatch 'cache' }
    if ($skippedToList.Count -gt 0) {
        $skippedToList | ForEach-Object { "$($_.Reason) `t $($_.Path)" } | Out-File -FilePath $skipLogFile -Encoding $outEncoding
        Write-Host "`nSkipped files (written to $skipLogFile):"
        $skippedToList | ForEach-Object { Write-Host "$($_.Reason) `t $($_.Path)" }
    }
    exit 0
}

Write-Host "Found $fileCount files. Writing to $outputFile ...`n"

# --- Write files to output ---
foreach ($file in $files) {
    $relativePath = Get-RelativePath -basePath $rootPath -fullPath $file.FullName

    ("`n`n" + ('=' * 80)) | Out-File -FilePath $outputFile -Append -Encoding $outEncoding
    ("FILE: $relativePath") | Out-File -FilePath $outputFile -Append -Encoding $outEncoding
    ("LAST MODIFIED: $($file.LastWriteTime)") | Out-File -FilePath $outputFile -Append -Encoding $outEncoding
    (('=' * 80) + "`n") | Out-File -FilePath $outputFile -Append -Encoding $outEncoding

    try {
        Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop |
            Out-File -FilePath $outputFile -Append -Encoding $outEncoding -ErrorAction Stop
    } catch {
        $errMsg = "→ Error reading/writing file: $($_.Exception.Message)"
        $errMsg | Out-File -FilePath $skipLogFile -Append -Encoding $outEncoding
        $skipped += [PSCustomObject]@{ Path = $file.FullName; Reason = "ReadOrWriteError:$($_.Exception.GetType().Name)" }
    }

    "`n" | Out-File -FilePath $outputFile -Append -Encoding $outEncoding
}

# --- Write skipped list (non-cache) ---
if ($skipped.Count -gt 0) {
    $skippedToList = $skipped | Where-Object { $_.Reason -notmatch 'cache' -and $_.Path -notmatch 'cache' }
    if ($skippedToList.Count -gt 0) {
        $skippedToList | ForEach-Object { "$($_.Reason) `t $($_.Path)" } | Out-File -FilePath $skipLogFile -Append -Encoding $outEncoding
        Write-Host "`nSkipped files (not including cache-related skips):"
        $skippedToList | ForEach-Object { Write-Host "$($_.Reason) `t $($_.Path)" }
        Write-Host "`nSkipped list written to: $skipLogFile"
    } else {
        Write-Host "`nNo non-cache skipped files to list."
    }
} else {
    Write-Host "`nNo files were skipped."
}

# --- Final safe report ---
if (Test-Path $outputFile) {
    $outItem = Get-Item $outputFile
    Write-Host "`nDone!" -ForegroundColor Green
    Write-Host "Total files processed: $fileCount"
    Write-Host "Output file: $($outItem.FullName)"
    Write-Host "Size: $([math]::Round($outItem.Length / 1MB, 2)) MB"
} else {
    Write-Host "`nDone!" -ForegroundColor Green
    Write-Host "Total files processed: $fileCount"
    Write-Host "Output file: (not created)"
    Write-Host "Size: 0 MB"
}