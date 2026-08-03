@echo off
if not exist "%RUSTFS_STORAGE%" mkdir "%RUSTFS_STORAGE%"
rustfs.exe server --address "0.0.0.0:%RUSTFS_ADDRESS%" --console-enable --console-address "0.0.0.0:%RUSTFS_CONSOLE_ADDRESS%" "%RUSTFS_STORAGE%"
