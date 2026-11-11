@echo off
title Taj Gifts - Deploy
cd /d "%~dp0"
echo.
echo   TAJ GIFTS  -  push this release to GitHub
echo   Netlify rebuilds the live site automatically.
echo   -----------------------------------------------------
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo   Git is not installed. Get it from https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)
git config user.email >nul 2>nul
if errorlevel 1 git config user.email "tajgifts.orders@gmail.com"
git config user.name >nul 2>nul
if errorlevel 1 git config user.name "Taj Gifts"
echo   Files changed in this release:
echo.
git status --short
echo.
git add -A
git commit -m "Taj Gifts release"
echo.
git push origin main
if errorlevel 1 (
  echo.
  echo   PUSH FAILED. If it asked for a password, GitHub needs a
  echo   Personal Access Token: github.com - Settings - Developer
  echo   settings - Personal access tokens - Tokens ^(classic^) - repo.
  echo.
  pause
  exit /b 1
)
echo.
echo   PUSHED. Netlify is rebuilding - about 2 minutes.
echo   Check: https://tajgifts.netlify.app/api/app/auth
echo.
pause
