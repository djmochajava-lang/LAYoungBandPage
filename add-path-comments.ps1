# add-path-comments.ps1
# Adds relative file path as a comment to the first line of all code files
# Re-running will UPDATE the path if file was moved

$rootPath = Get-Location

$commentStyles = @{
    '.css'  = @{ Start = '/* '; End = ' */' }
    '.scss' = @{ Start = '/* '; End = ' */' }
    '.js'   = @{ Start = '// '; End = '' }
    '.ts'   = @{ Start = '// '; End = '' }
    '.html' = @{ Start = '<!-- '; End = ' -->' }
    '.md'   = @{ Start = '<!-- '; End = ' -->' }
    '.yml'  = @{ Start = '# '; End = '' }
    '.yaml' = @{ Start = '# '; End = '' }
    '.rb'   = @{ Start = '# '; End = '' }
    '.py'   = @{ Start = '# '; End = '' }
    '.sh'   = @{ Start = '# '; End = '' }
}

$excludeFolders = @('node_modules', '.git', '_site', '.sass-cache', '.jekyll-cache', 'vendor')

$allFiles = Get-ChildItem -Recurse -File | Where-Object {
    $ext = $_.Extension.ToLower()
    $isSupported = $commentStyles.ContainsKey($ext)
    
    $notExcluded = $true
    foreach ($folder in $excludeFolders) {
        if ($_.FullName -like "*\$folder\*") {
            $notExcluded = $false
            break
        }
    }
    
    $isSupported -and $notExcluded
}

Write-Host "Found $($allFiles.Count) files to process..." -ForegroundColor Cyan
Write-Host ""

$processedCount = 0
$skippedCount = 0
$updatedCount = 0

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Replace($rootPath.Path + "\", "").Replace("\", "/")
    
    $ext = $file.Extension.ToLower()
    $commentStart = $commentStyles[$ext].Start
    $commentEnd = $commentStyles[$ext].End
    
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($null -eq $content) {
        Write-Host "  Skipped (empty or unreadable): $relativePath" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    $commentLine = "$commentStart$relativePath$commentEnd"
    
    # Get first line (handling both line endings)
    $firstLine = ($content -split "`r`n|`n|`r")[0]
    
    # Check if the correct comment already exists
    if ($firstLine -eq $commentLine) {
        Write-Host "  Already correct: $relativePath" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    # Pattern to detect ANY path comment (same style, different path)
    $pathCommentPattern = "^" + [regex]::Escape($commentStart) + ".*" + [regex]::Escape($commentEnd) + "$"
    
    # Check if first line is a path comment (possibly outdated)
    if ($firstLine -match $pathCommentPattern) {
        # REPLACE the old path comment with new one
        $lines = $content -split "`r`n|`n|`r"
        $lines[0] = $commentLine
        $newContent = $lines -join "`n"
        
        Write-Host "  Updated path: $relativePath" -ForegroundColor Cyan
        $updatedCount++
    }
    # Special handling for files with Jekyll front matter
    elseif ($content -match '^---\s*[\r\n]') {
        # Check if second line (after path comment) has front matter
        $lines = $content -split "`r`n|`n|`r"
        if ($lines.Count -gt 1 -and $lines[1] -match '^---\s*$') {
            # First line is old path comment, replace it
            $lines[0] = $commentLine
            $newContent = $lines -join "`n"
            Write-Host "  Updated path: $relativePath" -ForegroundColor Cyan
            $updatedCount++
        }
        else {
            # No path comment yet, add before front matter
            $newContent = "$commentLine`n$content"
            Write-Host "  Added comment: $relativePath" -ForegroundColor Green
            $processedCount++
        }
    }
    else {
        # Add new comment at the beginning
        $newContent = "$commentLine`n`n$content"
        Write-Host "  Added comment: $relativePath" -ForegroundColor Green
        $processedCount++
    }
    
    # Write updated content back to file
    try {
        $newContent | Set-Content $file.FullName -NoNewline
    }
    catch {
        Write-Host "  Error: $relativePath - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Processing complete!" -ForegroundColor Green
Write-Host "  Added: $processedCount" -ForegroundColor Green
Write-Host "  Updated: $updatedCount" -ForegroundColor Cyan
Write-Host "  Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan