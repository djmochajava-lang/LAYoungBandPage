# =============================================================================
# Gallery Image Renamer Script (PowerShell)
# Renames all images in images\gallery to event001.jpg, event002.jpg, etc.
# =============================================================================

#Requires -Version 5.1

# Configuration
$GALLERY_DIR = "images\gallery"
$PREFIX = "event"
$START_NUM = 1

# =============================================================================
# Functions
# =============================================================================

function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Gallery Image Renamer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-GalleryDirectory {
    if (-not (Test-Path -Path $GALLERY_DIR)) {
        Write-ErrorMsg "Directory '$GALLERY_DIR' does not exist!"
        Write-Host ""
        Write-Host "Please create it first:"
        Write-Host "  mkdir $GALLERY_DIR"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

function Get-ImageCount {
    $extensions = @('*.jpg', '*.jpeg', '*.png', '*.gif', '*.JPG', '*.JPEG', '*.PNG', '*.GIF')
    $count = 0
    
    foreach ($ext in $extensions) {
        $files = Get-ChildItem -Path $GALLERY_DIR -Filter $ext -ErrorAction SilentlyContinue
        $count += $files.Count
    }
    
    return $count
}

function New-BackupDirectory {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "${GALLERY_DIR}_backup_${timestamp}"
    
    Write-Info "Creating backup at: $backupDir"
    
    try {
        Copy-Item -Path $GALLERY_DIR -Destination $backupDir -Recurse -ErrorAction Stop
        Write-Success "Backup created successfully"
        return $backupDir
    }
    catch {
        Write-ErrorMsg "Failed to create backup: $_"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

function Get-NormalizedExtension {
    param([string]$Extension)
    
    # Remove leading dot and convert to lowercase
    $ext = $Extension.TrimStart('.').ToLower()
    
    # Normalize jpeg to jpg
    if ($ext -eq 'jpeg') {
        $ext = 'jpg'
    }
    
    return $ext
}

function Rename-GalleryImages {
    $counter = $START_NUM
    $renamedCount = 0
    $skippedCount = 0
    
    Write-Info "Starting rename process..."
    Write-Host ""
    
    # Create temporary directory
    $tempDir = "${GALLERY_DIR}_temp"
    if (Test-Path -Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
    New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
    
    # Get all image files
    $extensions = @('*.jpg', '*.jpeg', '*.png', '*.gif', '*.JPG', '*.JPEG', '*.PNG', '*.GIF')
    $files = @()
    
    foreach ($ext in $extensions) {
        $foundFiles = Get-ChildItem -Path $GALLERY_DIR -Filter $ext -ErrorAction SilentlyContinue
        $files += $foundFiles
    }
    
    # Sort files alphabetically
    $files = $files | Sort-Object Name
    
    # Process each file
    foreach ($file in $files) {
        # Get normalized extension
        $ext = Get-NormalizedExtension -Extension $file.Extension
        
        # Generate new filename with padding
        $newName = "{0}{1:D3}.{2}" -f $PREFIX, $counter, $ext
        $newPath = Join-Path -Path $tempDir -ChildPath $newName
        
        # Check if already correctly named
        if ($file.Name -eq $newName) {
            Write-Warning "Skipped: $($file.Name) (already correct)"
            $skippedCount++
            Copy-Item -Path $file.FullName -Destination $newPath -Force
        }
        else {
            try {
                Copy-Item -Path $file.FullName -Destination $newPath -Force -ErrorAction Stop
                Write-Success "Renamed: $($file.Name) → $newName"
                $renamedCount++
            }
            catch {
                Write-ErrorMsg "Failed: $($file.Name)"
            }
        }
        
        $counter++
    }
    
    # Move renamed files back
    if ($renamedCount -gt 0 -or $skippedCount -gt 0) {
        Write-Info "Moving renamed files back to gallery..."
        
        # Remove old files
        Get-ChildItem -Path $GALLERY_DIR -File | Remove-Item -Force
        
        # Move new files
        Get-ChildItem -Path $tempDir -File | Move-Item -Destination $GALLERY_DIR -Force
        
        # Remove temp directory
        Remove-Item -Path $tempDir -Force
    }
    
    Write-Host ""
    Write-Success "Rename complete!"
    Write-Host ""
    Write-Host "Summary:"
    Write-Host "  • Renamed: $renamedCount files"
    Write-Host "  • Skipped: $skippedCount files"
    Write-Host "  • Total:   $($renamedCount + $skippedCount) files"
    
    return @{
        Renamed = $renamedCount
        Skipped = $skippedCount
        Total = $renamedCount + $skippedCount
    }
}

function Show-CurrentFiles {
    Write-Host ""
    Write-Info "Current files in $GALLERY_DIR :"
    Write-Host ""
    
    $extensions = @('*.jpg', '*.jpeg', '*.png', '*.gif')
    $files = @()
    
    foreach ($ext in $extensions) {
        $foundFiles = Get-ChildItem -Path $GALLERY_DIR -Filter $ext -ErrorAction SilentlyContinue
        $files += $foundFiles
    }
    
    $files = $files | Sort-Object Name
    
    if ($files.Count -gt 20) {
        $files | Select-Object -First 20 | ForEach-Object { Write-Host "  $($_.Name)" }
        Write-Host "  ... and $($files.Count - 20) more files"
    }
    else {
        $files | ForEach-Object { Write-Host "  $($_.Name)" }
    }
    
    Write-Host ""
}

function New-SlideshowConfig {
    $configFile = "slideshow-config.txt"
    
    Write-Info "Generating slideshow configuration..."
    
    $config = @"
// Paste this into your gallery-with-slideshow.html file:
// Replace the existing slideshowConfig.images array

images: [
"@
    
    # Get all renamed image files
    $extensions = @('*.jpg', '*.jpeg', '*.png', '*.gif')
    $files = @()
    
    foreach ($ext in $extensions) {
        $foundFiles = Get-ChildItem -Path $GALLERY_DIR -Filter $ext -ErrorAction SilentlyContinue
        $files += $foundFiles
    }
    
    $files = $files | Sort-Object Name
    
    $counter = $START_NUM
    foreach ($file in $files) {
        $config += "`n  { src: 'images/gallery/$($file.Name)', caption: 'Event photo $counter' },"
        $counter++
    }
    
    $config += "`n],"
    
    # Save to file
    Set-Content -Path $configFile -Value $config -Encoding UTF8
    
    Write-Success "Configuration saved to: $configFile"
    Write-Host ""
    Write-Host "Preview:"
    Get-Content -Path $configFile -TotalCount 10
    Write-Host "..."
}

# =============================================================================
# Main Script
# =============================================================================

function Main {
    # Set console encoding to UTF-8 for emojis
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    # Display header
    Write-Header
    
    # Check if directory exists
    Test-GalleryDirectory
    
    # Count images
    $imageCount = Get-ImageCount
    
    if ($imageCount -eq 0) {
        Write-Warning "No images found in $GALLERY_DIR"
        Write-Host ""
        Write-Host "Supported formats: jpg, jpeg, png, gif"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 0
    }
    
    Write-Info "Found $imageCount image(s) in $GALLERY_DIR"
    
    # Show current files
    Show-CurrentFiles
    
    # Ask for confirmation
    Write-Host "This will rename all images to ${PREFIX}001.jpg, ${PREFIX}002.jpg, etc." -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Do you want to continue? (y/n)"
    
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Warning "Operation cancelled by user"
        Read-Host "Press Enter to exit"
        exit 0
    }
    
    Write-Host ""
    
    # Create backup
    $backupDir = New-BackupDirectory
    Write-Host ""
    
    # Rename images
    $results = Rename-GalleryImages
    
    # Generate config
    New-SlideshowConfig
    
    # Final message
    Write-Host ""
    Write-Success "All done!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Check the renamed files in: $GALLERY_DIR"
    Write-Host "  2. Copy the config from: slideshow-config.txt"
    Write-Host "  3. Paste it into your gallery-with-slideshow.html"
    Write-Host ""
    Write-Host "Backup saved at: $backupDir"
    Write-Host ""
    
    Read-Host "Press Enter to exit"
}

# Run main function
Main