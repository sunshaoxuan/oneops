@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-domain-proxy.ps1" -PackageRoot "%~dp0"
exit /b %ERRORLEVEL%
