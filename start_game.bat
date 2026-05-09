@echo off
echo Starting ETI MCQ Challenge...
echo.
echo Server running at: http://localhost:8080
echo Press Ctrl+C to stop.
echo.
start "" "http://localhost:8080"
python -m http.server 8080
