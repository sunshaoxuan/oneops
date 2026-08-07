# Test results

## Full check

Command: `..\runtime\node\pnpm.cmd check`

Result:

1. Gateway tests: 205 passed.
2. Builder Python tests: 14 passed.
3. Portal tests: 155 passed in 18 files.
4. TypeScript build and Vite production build passed.
5. Exit code 0.

Vite emitted its configured chunk size advisory. It did not fail the build.

## Runtime and browser

1. Spring 8092 formal health route returned 200 and `UP`, version 0.13.0.
2. Gateway 8093 formal health route returned 200 and `UP`.
3. The Customize table displayed the applied physical record.
4. The VPN page displayed `SoftEther VPN Client`.
5. The Environment page displayed `U-PDS DB`, `U-HR・マイナ DB` and `お客様環境`.
6. Browser Console returned zero errors and zero warnings.
