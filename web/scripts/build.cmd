echo Building react for %1
CALL .\node_modules\.bin\env-cmd -f .env.%1 react-scripts build


echo "Copying extra files"
copy ..\config\config.json ..\data\.
del ..\data\grand-piano\samples\*

