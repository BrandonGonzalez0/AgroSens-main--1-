@echo off
echo Installing security dependencies for AgroSens...

cd backend
echo Installing backend security dependencies...
npm install connect-mongo@^5.1.0 express-rate-limit@^7.1.5 express-session@^1.17.3 file-type@^19.0.0 helmet@^7.1.0 html-escaper@^2.0.2 validator@^13.11.0

cd ..\frontend
echo Installing frontend dependencies...
npm install

echo.
echo Security dependencies installed successfully!
echo.
echo Next steps:
echo 1. Copy backend\.env.example to backend\.env and configure your settings
echo 2. Update FRONTEND_URL and SESSION_SECRET in .env file
echo 3. Run 'npm run dev' in backend directory to start secure server
echo.
pause