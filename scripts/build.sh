#!/bin/bash

# Get the command line argument
arg=$1

if [ "$arg" == "image" ]; then
    echo "Building to data-folder to copy to NodeMCU"
    cd ../web
    npm run-script image
    echo "Please copy the data folder as an image to NodeMCU"
elif [ "$arg" == "local" ]; then
    echo "Building to \"build\" folder in order to run piano web interface and sounds locally"
    cd ../web
    npm run-script local
    echo "Start the local server with \"run.cmd local\""
else
    echo "Unknown environment $arg"
    echo "Possible environments are:"
    echo "  - image: build to data-folder to write to NodeMCU"
    echo "  - local: sounds offline (in instruments folder)"
fi
