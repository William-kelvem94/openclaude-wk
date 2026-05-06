@echo off
setlocal
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado no PATH.
  echo Instale Node 20+ e abra o terminal novamente.
  exit /b 1
)
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%dist\cli.mjs" %*
endlocal
