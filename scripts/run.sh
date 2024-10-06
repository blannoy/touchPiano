#!/bin/bash

# Get the command line argument
arg=$1

# Check if the argument is "local"
if [ "$arg" == "local" ]; then
    echo "Running piano web interface and sounds locally"
    cd ../web
    serve -s build
# Check if the argument is "start"
elif [ "$arg" == "start" ]; then
    echo "Running piano web interface and sounds from internet"
    cd ../web
    npm run-script start
# Check if the argument is "python"
elif [ "$arg" == "python" ]; then
    echo "Running piano python client"
    cd ../python-client
    python3 touchPiano.py
else
    echo "Unknown environment $arg"
    echo "Possible environments are:"
    echo "  - start: sounds from internet"
    echo "  - local: sounds offline (in instruments folder)"
fi
