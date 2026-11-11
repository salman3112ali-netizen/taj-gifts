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
git commit -m "Taj Gifts release: security hardening, customer cancellation, email fix"
echo.

git push origin main
if errorlevel 1 (
  echo.
  echo   -----------------------------------------------------
  echo   PUSH FAILED.
  echo   If it asked for a password, GitHub needs a Personal Access Token:
  echo     github.com - Settings - Developer settings - Personal access tokens
  echo     - Tokens ^(classic^) - Generate new token - tick "repo"
  echo   Paste the token as the password.
  echo   -----------------------------------------------------
  echo.
  pause
  exit /b 1
)

echo.
echo   -----------------------------------------------------
echo   PUSHED. Netlify is rebuilding now - about 2 minutes.
echo.
echo   Verify:  https://tajgifts.netlify.app/api/app/auth
echo   Expect:  {"ok":true,"service":"Taj Gifts native account API"}
echo.
echo   Then check the contact page shows:
echo            tajgifts.orders@gmail.com
echo   -----------------------------------------------------
echo.
pause
