# Touch-based floor piano
This project contains the source code to drive a MPR121 & Nodemcu based "floor piano".

![20240609_182555](https://github.com/blannoy/touchPiano/assets/23641978/8f17ac4f-2ba5-4bd6-ac69-f2d3ead8ca87)

## Components & material
### Electronics
- NodeMCU ESP8266
- 2x [Adafruit MPR121](https://www.adafruit.com/product/1982) -> 12 pins each = 24 keys
The system is powered via NodeMCU USB port. The setup was put together on a prototype board. 
![20240620_102826](https://github.com/blannoy/touchPiano/assets/23641978/e380aa0b-6bcb-4161-9a7a-b3b9b88b9157)

> Warning: powering the NodeMCU with a battery is preferred. Using a laptop or USB charger can lead to noise which may trigger a 'hit'.

### Physical world
The piano was built using aluminium foil glued to cardboard and covered with a sheet of tissue paper.
A piece of [copper tape with conductive adhesive](https://www.adafruit.com/product/3483) was fixed on the foil. This makes it easy to solder a wire to the foil.
Do this for each piece of the piano (e.g. 24 keys) or other layout you wish to use.
Each wire needs to be connected to a pin of the MPR121.

## Software
### Setup
The software was developed using Visual Studio Code combined with PlatformIO.
There are 2 main parts: the firmware and a React based front-end.
Directory layout:
/src : firmware source code
/web/src : web front end source code
/config : location for config.json that will be copied during build of the website
/data: folder for NodeMCU image info
/instruments: folder with instruments.json, that contains possible instruments. These were obtained from [here](https://github.com/gleitz/midi-js-soundfonts/). You will need to get them yourself as they are not included in the project.
### Firmware
The NodeMCU firmware contains a REST API that can be used to:
- start/stop the MPR121
- stream JSON data (using Server Sent Events, SSE) to listening clients. Depending on the API endpoint, the stream contains for each pin the (raw) sensor data, a running average, a hit signal and a hit state
- modify different parameters of the software / sensor registers
The main configuration is stored on the board in a JSON file.
A sample JSON configuration is in the /config folder. This file is copied during the image-build of the web site. It contains the register values for the sensors, threshold values for touch/release, moving average period, wifi mode and threshold mode.

The **threshold** can be used in two modes, of which CROSS seemed to work the best.
- CROSS: when the signal goes below the threshold, the release threshold is set at 85% of the difference between average and the current value
- STANDARD: fixed values of touch an release threshold relative to the moving average

**Wifi** mode: WifiManager is used to connect the NodeMCU to an existing Wifi network. On first load an AP will be available to configure the client. After that you can choose to use the existing wifi network (CLIENT) or let the NodeMCU setup its own AP (mode AP) where you will need to provide a password (via the web interface).

### Web front end
A React frontend is used to control the sensor and readout the different JSON-streams. The source code is in web/src.
The menu contains:
- Play: a rendition of piano, selection of instrument and buttons to start the piano aith or without sound. The state of the key is shown.
- Thresholds: set and visualize the thresholds and hits. Easy to setup the piano and debug its sensitivity.
- Registers: an interface to set and visualize the impact of setting different registers of the MPR121.
- Admin: set some additional parameters. These are the wifi mode, threshold mode, a delay to perform an autolrelease of  key, the moving average period (number of values to average)

Building the React app can be done in 2 modes:
- image: site is built and stored in /data. This needs to be uploaded to to the nodeMCU. Due to the size of the instrument files, these will be fetched over the internet when running the site in a browser.
- local: site is built in /web/build containing the instrument files that are present in /instruments. 
The front-end can be run in different setups. The .env.* files are used to set some variables. Main variables are REACT_APP_BASE_URL (where is the firmware API endpoint) and REACT_APP_SOUND_URL (where are the instruments).
- start: the site is run in development mode. Instrument files are fetched over the internet.
- local: the site runs in production mode on a machine as localhost and communicates with the NodeMCU API. The instrument-files are locally stored.
state for each pin and a hit-signal for each p
