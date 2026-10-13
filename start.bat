@echo off
chcp 65001 >nul
title Cukraszmuhely - Recepttar
cd /d "%~dp0"
node scripts\start.mjs
echo.
echo A szerver leallt.
pause
