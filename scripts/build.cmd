@echo Building react for %1
CALL .\node_modules\.bin\env-cmd -f .env.%1 react-scripts build

@echo "Copying config"
copy ..\config\config.json ..\data\.
