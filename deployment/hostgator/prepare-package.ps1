param([string]$ReleaseName = 'is-coach-hostgator-2026-11-17-v1-0-r32')

$ErrorActionPreference = 'Stop'
if ($ReleaseName -notmatch '^[a-zA-Z0-9-]+$') { throw 'Invalid release name' }

$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$composerPhar = Join-Path $projectRoot '.tools/composer.phar'
$distPath = Join-Path $projectRoot 'frontend/dist'
$releasesPath = Join-Path $projectRoot 'releases'
$releaseZip = Join-Path $releasesPath "$ReleaseName.zip"
$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$stagePath = Join-Path $tempBase ("is-coach-package-" + [Guid]::NewGuid().ToString('N'))
$stagePath = [IO.Path]::GetFullPath($stagePath)

if (-not $stagePath.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe temporary staging path.' }
if (Test-Path -LiteralPath $releaseZip) { throw 'Release archive already exists; choose a new name.' }
if (-not (Test-Path -LiteralPath $composerPhar)) { throw 'Composer PHAR was not found.' }
if (-not (Test-Path -LiteralPath (Join-Path $distPath 'index.html'))) { throw 'Frontend build was not found. Run npm run build first.' }
if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) { throw 'tar.exe was not found.' }

$backendPath = Join-Path $stagePath 'private/is-coach-backend'
$publicPath = Join-Path $stagePath 'public_html/app'
$temporaryZip = Join-Path $tempBase "$ReleaseName-$([Guid]::NewGuid().ToString('N')).zip"

try {
    New-Item -ItemType Directory -Path $backendPath,$publicPath | Out-Null
    foreach ($folder in @('app','config','routes','resources')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot "backend-laravel/$folder") -Destination $backendPath -Recurse
    }
    Copy-Item -LiteralPath (Join-Path $projectRoot 'backend-laravel/vendor') -Destination $backendPath -Recurse
    foreach ($folder in @('bootstrap/cache','database','storage/app/private','storage/framework/cache/data','storage/framework/sessions','storage/framework/views','storage/logs')) {
        New-Item -ItemType Directory -Path (Join-Path $backendPath $folder) -Force | Out-Null
    }
    foreach ($folder in @('migrations','seeders','factories')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot "backend-laravel/database/$folder") -Destination (Join-Path $backendPath 'database') -Recurse
    }
    foreach ($file in @('artisan','composer.json','composer.lock','bootstrap/app.php','bootstrap/providers.php')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot "backend-laravel/$file") -Destination (Join-Path $backendPath $file)
    }
    foreach ($item in Get-ChildItem -LiteralPath $distPath -Force) {
        if ($item.Name -ne '.htaccess') { Copy-Item -LiteralPath $item.FullName -Destination $publicPath -Recurse }
    }

    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'public-index.php') -Destination (Join-Path $publicPath 'index.php')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '.user.ini') -Destination $publicPath
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '.env.homologation.example') -Destination $backendPath
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination $stagePath
    New-Item -ItemType Directory -Path (Join-Path $stagePath 'docs') | Out-Null
    Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/funcionalidades-completas-2026-09-23.md') -Destination (Join-Path $stagePath 'docs')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'public-htaccess') -Destination (Join-Path $stagePath 'docs/public-htaccess.template')

    if (Test-Path -LiteralPath (Join-Path $publicPath '.htaccess')) { throw 'The package must preserve the cPanel-managed .htaccess on the server.' }
    $htaccessTemplate = Get-Content -Raw -LiteralPath (Join-Path $stagePath 'docs/public-htaccess.template')
    if ($htaccessTemplate -match 'AddHandler|SetHandler' -or $htaccessTemplate -notmatch 'RewriteRule \^ index.php \[L\]') {
        throw 'The .htaccess template must contain routing rules without a PHP handler.'
    }

    & php $composerPhar install --working-dir=$backendPath --no-dev --no-scripts --optimize-autoloader --no-interaction --no-progress --prefer-dist
    if ($LASTEXITCODE -ne 0) { throw 'Composer production installation failed.' }

    $criticalFiles = @(
        'vendor/autoload.php',
        'vendor/symfony/routing/Route.php',
        'vendor/laravel/framework/src/Illuminate/Foundation/resources/exceptions/renderer/components/empty-state.blade.php',
        'app/Http/Controllers/Api/V1/ExerciseThumbnailController.php',
        'database/migrations/2026_09_20_100000_preserve_workouts_when_exercises_are_deleted.php',
        'database/migrations/2026_09_22_120000_add_workout_schedule_fields.php',
        'database/migrations/2026_09_22_130000_add_cancelled_at_to_workout_sessions.php',
        'database/migrations/2026_10_01_232815_add_guardian_awareness_to_student_profiles.php',
        'database/migrations/2026_10_09_100000_add_category_to_exercises_and_workout_snapshots.php',
        'database/migrations/2026_10_16_205121_add_timed_sets_to_workouts.php',
        'database/migrations/2026_11_09_113436_create_weekly_feedbacks_table.php',
        'database/migrations/2026_11_09_113905_create_external_assessment_clients_table.php',
        'database/migrations/2026_11_09_113906_create_external_assessments_table.php',
        'database/migrations/2026_11_09_113907_create_external_assessment_photos_table.php',
        'database/migrations/2026_11_09_115247_add_verbal_photo_authorization_to_external_assessment_clients_table.php',
        'database/migrations/2026_11_09_180601_create_weekly_feedback_reminders_table.php',
        'database/migrations/2026_11_10_182753_add_review_to_weekly_feedbacks_table.php',
        'database/migrations/2026_11_17_123534_sort_workout_plan_weekdays_in_week_order.php'
    )
    foreach ($file in $criticalFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $backendPath $file))) { throw "Critical package file is missing: $file" }
    }

    & tar.exe -a -c -f $temporaryZip -C $stagePath .
    if ($LASTEXITCODE -ne 0) { throw 'Portable ZIP creation failed.' }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($temporaryZip)
    try {
        $rawNames = @($archive.Entries.FullName)
        if ($rawNames -match '\\') { throw 'Archive validation failed; Windows path separators were found.' }
        $names = @($rawNames | ForEach-Object { $_ -replace '^\./', '' })
        foreach ($entry in @(
            'private/is-coach-backend/vendor/autoload.php',
            'private/is-coach-backend/vendor/symfony/routing/Route.php',
            'private/is-coach-backend/vendor/laravel/framework/src/Illuminate/Foundation/resources/exceptions/renderer/components/empty-state.blade.php',
            'private/is-coach-backend/app/Http/Controllers/Api/V1/ExerciseThumbnailController.php',
            'private/is-coach-backend/database/migrations/2026_09_20_100000_preserve_workouts_when_exercises_are_deleted.php',
            'private/is-coach-backend/database/migrations/2026_09_22_120000_add_workout_schedule_fields.php',
            'private/is-coach-backend/database/migrations/2026_09_22_130000_add_cancelled_at_to_workout_sessions.php',
            'private/is-coach-backend/database/migrations/2026_10_01_232815_add_guardian_awareness_to_student_profiles.php',
            'private/is-coach-backend/database/migrations/2026_10_09_100000_add_category_to_exercises_and_workout_snapshots.php',
            'private/is-coach-backend/database/migrations/2026_10_16_205121_add_timed_sets_to_workouts.php',
            'private/is-coach-backend/database/migrations/2026_11_09_113436_create_weekly_feedbacks_table.php',
            'private/is-coach-backend/database/migrations/2026_11_09_113905_create_external_assessment_clients_table.php',
            'private/is-coach-backend/database/migrations/2026_11_09_113906_create_external_assessments_table.php',
            'private/is-coach-backend/database/migrations/2026_11_09_113907_create_external_assessment_photos_table.php',
            'private/is-coach-backend/database/migrations/2026_11_09_115247_add_verbal_photo_authorization_to_external_assessment_clients_table.php',
            'private/is-coach-backend/database/migrations/2026_11_09_180601_create_weekly_feedback_reminders_table.php',
            'private/is-coach-backend/database/migrations/2026_11_10_182753_add_review_to_weekly_feedbacks_table.php',
            'private/is-coach-backend/database/migrations/2026_11_17_123534_sort_workout_plan_weekdays_in_week_order.php',
            'public_html/app/index.html',
            'docs/public-htaccess.template',
            'public_html/app/favicon.ico',
            'public_html/app/icons/apple-touch-icon.png',
            'public_html/app/icons/icon-192.png',
            'public_html/app/icons/icon-512.png',
            'docs/funcionalidades-completas-2026-09-23.md'
        )) {
            if ($names -notcontains $entry) { throw "Archive validation failed; missing entry: $entry" }
        }
        if ($names -contains 'public_html/app/.htaccess') { throw 'Archive validation failed; the cPanel-managed .htaccess would be overwritten.' }
        if ($names -match '(^|/)\.env$|\.sqlite$|\.log$|\.map$|(^|/)tests/|(^|/)node_modules/') {
            throw 'Archive validation failed; a forbidden local or development file was included.'
        }
    }
    finally {
        $archive.Dispose()
    }

    Copy-Item -LiteralPath $temporaryZip -Destination $releaseZip
    if ((Get-FileHash -LiteralPath $temporaryZip -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $releaseZip -Algorithm SHA256).Hash) {
        throw 'Release copy validation failed; checksums differ.'
    }
    Write-Output "Prepared and validated: $releaseZip"
}
finally {
    if (Test-Path -LiteralPath $temporaryZip) { Remove-Item -LiteralPath $temporaryZip -Force }
    if ($stagePath.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $stagePath)) {
        Remove-Item -LiteralPath $stagePath -Recurse -Force
    }
}
