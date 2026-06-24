@echo off
:: NanoBot Chrome Extension Build & Zip Batch Utility
:: OS: Windows

setlocal enabledelayedexpansion

echo ===================================================
echo  NanoBot - Production Build ^& Archive Utility
echo ===================================================
echo.

:: 1. Navigate to the project root directory (containing this bat file)
cd /d "%~dp0"

:: 2. Check if package.json exists to verify we are in the correct root folder
if not exist "package.json" (
    echo [ERROR] package.json not found in this directory.
    echo Please make sure this batch file is in the NanoBotEx root folder.
    pause
    exit /b 1
)

:: 3. Run production build
echo [1/2] Running 'npm run build'...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm run build failed with exit code %errorlevel%.
    echo Aborting archive creation.
    pause
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] Build completed successfully.
echo.

:: 4. Clear any existing archive in root
if exist "nanobot-extension.zip" (
    echo Existing "nanobot-extension.zip" found. Deleting for a fresh overwrite...
    del /f /q "nanobot-extension.zip"
)

:: 5. Compress dist contents using PowerShell Compress-Archive
echo [2/2] Compressing dist contents to nanobot-extension.zip...
powershell -NoProfile -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'nanobot-extension.zip' -Force"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compression failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo  [SUCCESS] All steps completed successfully!
echo  Archive location: %~dp0nanobot-extension.zip
echo ===================================================
echo.
pause
