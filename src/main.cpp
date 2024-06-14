#include <Arduino.h>
#define DEBUG true
// #include <ESP8266WiFi.h>
// #include <WiFiClient.h>
// #include <ESP8266WebServer.h>
// #include <ESP8266WiFi.h>
// #define WIFIAP
const char *ssid = "touchPiano-AP";
#define NUMREADINGS 10
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

// ESP8266WebServer server(80);
AsyncWebServer server(80);
void webServerSetup();
void stopServer();

// Register settings see https://www.nxp.com/docs/en/data-sheet/MPR121.pdf and https://www.nxp.com/docs/en/application-note/AN3889.pdf
// byte FFI = 0, CDC = 63; // AFE register MPR121_CONFIG1 XXYYYYYY
// byte CDT = 5, SFI = 0;  // FRC register MPR121_CONFIG2 XXXYYZZZ
// byte touchThreshold = 9, releaseThreshold = 6;
// byte touchDebounce = 0, releaseDebounce = 0; // Debounce register MPR121_DEBOUNCE 0-7 : XTTTXRRR
// byte MHD[] = {5, 21}, NHD[2], NCL[2], FDL[] = {0, 40};

#include "wifi.h"
#include "webserver.h"
#define filesystem (LittleFS)

#ifndef _BV
#define _BV(bit) (1 << (bit))
#endif

// You can have up to 4 on one i2c bus but one is enough for testing!
Adafruit_MPR121 cap[NUMSENSORS];

// Keeps track of the last pins touched
// so we know when buttons are 'released'
uint16_t lastTouched[NUMSENSORS];
uint16_t currTouched[NUMSENSORS];
uint16_t avgCurrTouched[NUMSENSORS];
uint16_t avgLastTouched[NUMSENSORS];
RunningAverage averagedData[NUMSENSORS][NUMKEYS / 2];
uint16_t thresholdCrossed[NUMSENSORS][NUMKEYS / 2];

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

  // configWifi();
}

void sensorLoop()
{
  // Serial.println("loop");

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
      long currentAvg = averagedData[sensorNr][i].getAverage(value);
      if (((currentAvg - value) > config.customTouchThreshold[keyNr]) && !(avgCurrTouched[sensorNr] & _BV(i)))
      {
        bitSet(avgCurrTouched[sensorNr], i);
        thresholdCrossed[sensorNr][i] = value + (currentAvg - value) * 0.85;
      }
      //      else if (((value - currentAvg) > config.customReleaseThreshold[i]) && (avgCurrTouched[sensorNr] & _BV(i)))
      else if (avgCurrTouched[sensorNr] & _BV(i))
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
      }

      if (runMode == "calibrate")
      {
        filteredDataArray[keyNr] = value;
        baselineDataArray[keyNr] = cap[sensorNr].baselineData(i);
        keyState[keyNr] = currTouched[sensorNr] & _BV(i);
      }
      else if (runMode == "thresholds")
      {
        averagedDataArray[keyNr] = value;
        filteredDataArray[keyNr] = currentAvg;
        releaseDataArray[keyNr] = thresholdCrossed[sensorNr][i] - config.customReleaseThreshold[keyNr];
        keyState[keyNr] = bitRead(avgCurrTouched[sensorNr], i);
        keyHit[keyNr] = (avgCurrTouched[sensorNr] & _BV(i)) && !(avgLastTouched[sensorNr] & _BV(i));
        //       doc["filteredData_" + String(i)] = value;
        // doc["averagedData_" + String(i)] = currentAvg;
        //       doc["touchLimit_" + String(i)] = value-config.customTouchThreshold[i];
        //             doc["releaseLimit_" + String(i)] = value+config.customReleaseThreshold[i];
        // doc["touched_" + String(i)] = avgCurrTouched & _BV(i);
      }
      else if (runMode == "piano")
      {
        keyState[keyNr] = bitRead(avgCurrTouched[sensorNr], i);
        bool isHit = ((avgCurrTouched[sensorNr] & _BV(i)) && !(avgLastTouched[sensorNr] & _BV(i)));
        keyHit[keyNr] = isHit;
        if (isHit)
          sendHit = true;
      }
        if (keyState[keyNr]>0) keepHit=true;
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
         pianoEvents.send("{}", "message", millis());
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
