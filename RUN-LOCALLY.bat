@echo off
title Taj Gifts - Local preview
cd /d "%~dp0"
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js 22 is required: https://nodejs.org
  echo.
  pause
  exit /b 1
)
if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo   Paste your Supabase keys into the file that just opened.
  notepad ".env.local"
)
if not exist "node_modules" call npm ci
echo.
echo   Starting on http://localhost:3000   (Ctrl+C to stop)
echo.
call npm run dev
pause
