@echo off

rem Get the command line argument
set arg=%1

rem Check if the argument is "START"
if "%arg%"=="local" (
    echo Running piano web interface and sounds locally
    cd ..\web
    serve -s build
) else if "%arg%"=="start" (
    echo Running piano web interface and sounds from internet
    cd ..\web
    npm run-script start
) else if "%arg%"=="python" (
    echo Running piano python client
    cd ..\python-client
    python touchPiano.py
) else (
    echo Unknown environment %arg%
    echo Possible environments are: 
    echo   - start: sounds from internet
    echo   - local: sounds offline (in instruments folder)
)
pause
