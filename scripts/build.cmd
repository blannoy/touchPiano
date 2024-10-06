@echo off

rem Get the command line argument
set arg=%1

if "%arg%"=="image" (
    echo Building to data-folder to copy to NodeMCU
    cd ..\web
    npm run-script image
    echo Please copy the data folder as an image to NodeMCU
) else if "%arg%"=="local" (
    echo Building to "build" folder in order to run piano web interface and sounds locally
    cd ..\web
    npm run-script local
    echo Start the local server with "run.cmd local"
) else (
    echo Unknown environment %arg%
    echo Possible environments are: 
    echo   - image: build to data-folder to write to NodeMCU
    echo   - local: sounds offline (in instruments folder)
)
