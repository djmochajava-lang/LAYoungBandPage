# Save this as e.g. dump-project-code.ps1
# Then run in VS Code terminal: .\dump-project-code.ps1

# Configuration - you can modify these
$outputFile = "project-code-dump.txt"
$rootPath = Get-Location  # current folder where you run the script

# Common folders/files to completely skip
$excludeDirs = @(
    'node_modules',
    '.git',
    '.vscode',
    'venv',
    'env',
    '__pycache__',
    '.pytest_cache',
    'cache',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    'out',
    'public',           # ← comment out if you want to include public assets
    'static'            # ← comment out if needed
)

# File patterns to include (add more extensions as needed)
$includeExtensions = @(
    '*.js', '*.jsx', '*.ts', '*.tsx',
    '*.vue',
    '*.css', '*.scss', '*.sass', '*.less',
    '*.html', '*.htm',
    '*.py',
    '*.cs', '*.cshtml',
    '*.java',
    '*.go',
    '*.php',
    '*.rb',
    '*.rs',
    '*.cpp', '*.h', '*.hpp',
    '*.json', '*.yaml', '*.yml',
    '*.md', 'README*', 'Dockerfile', '*.dockerignore',
    '.env*', '*.config.js', '*.config.ts'
)

Write-Host "Collecting code files from: $rootPath"
Write-Host "Output will be saved to: $outputFile`n"

# Build the Get-ChildItem parameters
$files = Get-ChildItem -Path $rootPath -Recurse -File `
    -Include $includeExtensions `
    -ErrorAction SilentlyContinue `
    | Where-Object {
        $item = $_

        # Quick ancestor check using .FullName
        $pathParts = $item.FullName.Split([char[]]@('\','/'), [StringSplitOptions]::RemoveEmptyEntries)

        foreach ($part in $pathParts) {
            if ($excludeDirs -contains $part) {
                # Uncomment for debugging: Write-Host "Excluded due to folder: $($item.FullName)" -ForegroundColor DarkGray
                return $false
            }
        }

        # Optional: skip very large files (e.g. > 500 KB)
        if ($_.Length -gt 500KB) {
            Write-Host "Skipping large file: $($_.FullName)" -ForegroundColor DarkGray
            return $false
        }

        $true
    }

if ($files.Count -eq 0) {
    Write-Warning "No matching files found. Check your include patterns or folder structure."
    exit
}

Write-Host "Found $($files.Count) files. Writing to $outputFile ...`n"

# Remove old file if exists
if (Test-Path $outputFile) { Remove-Item $outputFile -Force }

# Write content with separators
foreach ($file in $files) {
    $relativePath = Resolve-Path -Relative -Path $file.FullName -RelativeBase $rootPath

    "`n`n" + "="*80 | Out-File -FilePath $outputFile -Append -Encoding utf8
    "FILE: $relativePath" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "LAST MODIFIED: $($file.LastWriteTime)" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "="*80 + "`n" | Out-File -FilePath $outputFile -Append -Encoding utf8

    try {
        Get-Content $file.FullName -Raw -ErrorAction Stop `
            | Out-File -FilePath $outputFile -Append -Encoding utf8
    }
    catch {
        "→ Error reading file: $($_.Exception.Message)" | Out-File -FilePath $outputFile -Append -Encoding utf8
    }

    "`n" | Out-File -FilePath $outputFile -Append -Encoding utf8
}

Write-Host "Done!" -ForegroundColor Green
Write-Host "Total files processed: $($files.Count)"
Write-Host "Output file: $((Get-Item $outputFile).FullName)"
Write-Host "Size: $((Get-Item $outputFile).Length / 1MB -as [int]) MB"