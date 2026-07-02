@echo off
title EventSync Git Auto-Backup
echo ====================================================
echo      EventSync GitHub Auto-Backup Utility
echo ====================================================
echo.

:: Stage all changed and new files
echo [1/3] Staging all files...
git add -A

:: Commit changes with current timestamp
echo [2/3] Committing changes...
git commit -m "Auto-backup: %date% %time%"

:: Push changes to GitHub repository
echo [3/3] Pushing to GitHub (main branch)...
git push origin main

echo.
echo ====================================================
echo Backup Sync Completed Successfully!
echo ====================================================
pause
