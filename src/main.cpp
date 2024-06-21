#include <Arduino.h>
#define DEBUG true
// #include <ESP8266WiFi.h>
// #include <WiFiClient.h>
// #include <ESP8266WebServer.h>
// #include <ESP8266WiFi.h>
// #define WIFIAP
const char *ssid = "touchPiano-AP";
#define MAXREADINGS 20
#include <headers.h>
#include <configuration.h>
#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#define WEBSERVER_H "fix confict"
#include <WiFiManager.h>
#include <ESPAsyncWebServer.h>
#include <ESP8266mDNS.h>
#include <Adafruit_MPR121.h>

AsyncWebServer server(80);
void webServerSetup();
void stopServer();

#include "wifi.h"
#include "webserver.h"
#define filesystem (LittleFS)


Adafruit_MPR121 cap[NUMSENSORS];

// Keeps track of the last pins touched
// so we know when buttons are 'released'
uint16_t lastTouched[NUMSENSORS];
uint16_t currTouched[NUMSENSORS];
uint16_t avgCurrTouched[NUMSENSORS];
uint16_t avgLastTouched[NUMSENSORS];
RunningAverage averagedData[NUMKEYS];
uint16_t thresholdCrossed[NUMSENSORS][NUMKEYS / 2];
long autoReleaseTimer[NUMKEYS];

uint8_t sensorAddress[] = {0x5A, 0x5B};

void sensorSetup()
{
  for (int i = 0; i < NUMSENSORS; i++)
  {
    cap[i] = Adafruit_MPR121();
  }
}

void setup()
{
  Serial.begin(115200);
  filesystem.begin();
  loadConfiguration(&config);
  dumpLittleFS();
  sensorSetup();
  wifiSetup();
  webServerSetup();

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

}

void sensorLoop()
{
  JsonDocument doc;
  JsonArray keyState = doc["keyState"].to<JsonArray>();
  JsonArray keyHit = doc["keyHit"].to<JsonArray>();
  JsonArray filteredDataArray = doc["filtered"].to<JsonArray>();
  JsonArray averagedDataArray = doc["averaged"].to<JsonArray>();
  JsonArray baselineDataArray = doc["baseline"].to<JsonArray>();
  JsonArray releaseDataArray = doc["release"].to<JsonArray>();
  bool sendPianoEvent = false;
  bool sendHit = false;
  bool keepHit = false;
  for (int sensorNr = 0; sensorNr < NUMSENSORS; sensorNr++)
  {
    currTouched[sensorNr] = cap[sensorNr].touched();

    for (uint8_t i = 0; i < 12; i++)
    {
      int keyNr = sensorNr * (NUMKEYS / NUMSENSORS) + i;
      long value = cap[sensorNr].filteredData(i);
      long currentAvg = averagedData[keyNr].getAverage(value);
      if (((currentAvg - value) > config.customTouchThreshold[keyNr]) && !(bitRead(avgCurrTouched[sensorNr],i)>0))
      {
        bitSet(avgCurrTouched[sensorNr], i);
        thresholdCrossed[sensorNr][i] = value + (currentAvg - value) * 0.85;
        autoReleaseTimer[sensorNr] = millis();
      }
      else if (bitRead(avgCurrTouched[sensorNr],i)>0)
      {
        switch (config.thresholdMode)
        {
        case STANDARD:
          if ((value - currentAvg) > config.customReleaseThreshold[keyNr])
          {
            bitClear(avgCurrTouched[sensorNr], i);
          }
          break;
        case CROSS:
          if (value > (thresholdCrossed[sensorNr][i] - config.customReleaseThreshold[keyNr]))
          {
            bitClear(avgCurrTouched[sensorNr], i);
          }
          break;
        default:
          break;
        }
        // autorelease after autorelease timer
        if ((millis() - autoReleaseTimer[sensorNr]) > config.autoRelease)
        {
          bitClear(avgCurrTouched[sensorNr], i);
        }
      }

      if (runMode == "calibrate")
      {
        filteredDataArray[keyNr] = value;
        baselineDataArray[keyNr] = cap[sensorNr].baselineData(i);
        keyState[keyNr] = (bitRead(currTouched[sensorNr],i)>0);
      }
      else if (runMode == "thresholds")
      {
        averagedDataArray[keyNr] = value;
        filteredDataArray[keyNr] = currentAvg;
        releaseDataArray[keyNr] = thresholdCrossed[sensorNr][i] - config.customReleaseThreshold[keyNr];
        keyState[keyNr] = (bitRead(avgCurrTouched[sensorNr], i)>0);
        keyHit[keyNr] = (bitRead(avgCurrTouched[sensorNr] ,i)>0) && !(bitRead(avgLastTouched[sensorNr],i)>0);
      }
      else if (runMode == "piano")
      {
        keyState[keyNr] = (bitRead(avgCurrTouched[sensorNr], i)>0);
        bool isHit = ( (bitRead(avgCurrTouched[sensorNr] ,i)>0) && !(bitRead(avgLastTouched[sensorNr],i)>0));
        keyHit[keyNr] = isHit;
        if (isHit)
          sendHit = true;
      }
      if (keyState[keyNr] > 0)
        keepHit = true;
    }
    if (keepHit)
    {
      digitalWrite(LED_BUILTIN, HIGH);
    }
    else
    {
      digitalWrite(LED_BUILTIN, LOW);
    }
    if (avgLastTouched[sensorNr] != avgCurrTouched[sensorNr])
    {
      sendPianoEvent = true;
    }
    lastTouched[sensorNr] = currTouched[sensorNr];
    avgLastTouched[sensorNr] = avgCurrTouched[sensorNr];
  }
  doc["clock"] = millis();

  String message = "";
  serializeJson(doc, message);

  if (runMode == "calibrate")
  {
    calibrationEvents.send(message.c_str(), "message", millis());
  }
  else if (runMode == "thresholds")
  {
    thresholdEvents.send(message.c_str(), "message", millis());
  }
  else if (runMode == "piano")
  {
    if (sendPianoEvent)
    {
      pianoEvents.send(message.c_str(), "message", millis());
      // empty event for python sse-client to fire
      //   pianoEvents.send("", "message", millis());
      if (sendHit)
      {
        Serial.print("pianoHit:");
        serializeJson(doc["keyHit"], Serial);
        Serial.println();
      }
    }
  }
}

void loop()
{
  // Get the currently touched pads
  // wifiLoop();
  if (serverStarted)
  {
    webServerLoop();
  }
  if (startSensor && !sensorStarted)
  {
    for (int sensorNr = 0; sensorNr < NUMSENSORS; sensorNr++)
    {
      if (!cap[sensorNr].begin(sensorAddress[sensorNr]))
      {
        Serial.printf("MPR121 %04X not found, check wiring?\n", sensorAddress[sensorNr]);
        while (1)
          ;
      }

      byte newAFE_Reg = (config.FFI << 6) | config.CDC;
      byte FCR_Reg = cap[sensorNr].readRegister8(MPR121_CONFIG2);
      byte ESI = (FCR_Reg & 0b00000111);
      byte newFCR_Reg = (config.CDT << 5) | (config.SFI << 3) | ESI;
      // byte debounce_Reg = cap[sensorNr].readRegister8(MPR121_DEBOUNCE);
      byte newDebounce_Reg = (config.touchDebounce << 4) | config.releaseDebounce;

      byte ECR_Reg = cap[sensorNr].readRegister8(MPR121_ECR);

      cap[sensorNr].writeRegister(MPR121_ECR, 0x0); // go to STOP Mode
      cap[sensorNr].writeRegister(MPR121_CONFIG1, newAFE_Reg);
      cap[sensorNr].writeRegister(MPR121_CONFIG2, newFCR_Reg);
      cap[sensorNr].setThresholds(config.touchThreshold, config.releaseThreshold);
      cap[sensorNr].writeRegister(MPR121_DEBOUNCE, newDebounce_Reg);
      cap[sensorNr].writeRegister(MPR121_MHDR, config.MHD[0]);
      cap[sensorNr].writeRegister(MPR121_NHDR, config.NHD[0]);
      cap[sensorNr].writeRegister(MPR121_NCLR, config.NCL[0]);
      cap[sensorNr].writeRegister(MPR121_FDLR, config.FDL[0]);
      cap[sensorNr].writeRegister(MPR121_MHDF, config.MHD[0]);
      cap[sensorNr].writeRegister(MPR121_NHDF, config.NHD[0]);
      cap[sensorNr].writeRegister(MPR121_NCLF, config.NCL[0]);
      cap[sensorNr].writeRegister(MPR121_FDLF, config.FDL[0]);
  for (int iLoop=0;iLoop<NUMKEYS;iLoop++){
    averagedData[iLoop].numReadings=config.averagePeriod;
  }
      cap[sensorNr].writeRegister(MPR121_ECR, ECR_Reg); // exit stop mode
    }
    startTime = millis();
    sensorStarted = true;
    Serial.printf("Started in mode %s\n", runMode);
  }
  else if (!startSensor && sensorStarted)
  {
    for (int sensorNr = 0; sensorNr < NUMSENSORS; sensorNr++)
    {
      cap[sensorNr].writeRegister(MPR121_ECR, 0x0); // go to STOP Mode
      avgLastTouched[sensorNr] = 0;
      avgCurrTouched[sensorNr] = 0;
    }
    sensorStarted = false;
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.printf("Stopped in mode %s\n", runMode);
  }

  if (sensorStarted)
  {
    sensorLoop();
  }
  if (runMode == "piano")
  {
    delay(10);
  }
  else
  {
    delay(50);
  }
}
