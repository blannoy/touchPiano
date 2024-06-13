#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <utils.h>
#include <FS.h>
#include <LittleFS.h>
#define MAXPWSIZE 30
#define filesystem (LittleFS)
String runMode;

typedef enum { CLIENT, AP} WifiMode;
String wifiModeString[2] = {"CLIENT", "AP"};

// Threshold modes
// STANDARD: "release" determined by increase amount of releaseThreshold above current average 
// CUSTOM: "release" determined by crossing the point where touch was detected - releaseThreshold 
typedef enum { STANDARD, CROSS } ThresholdMode;
String thresholdModeString[2] = {"STANDARD", "CROSS"};
#define NUMKEYS 24
#define NUMSENSORS 2
struct Configuration
{
    int customTouchThreshold[NUMKEYS];
    int customReleaseThreshold[NUMKEYS];
    byte FFI = 0, CDC = 63; // AFE register MPR121_CONFIG1 XXYYYYYY
    byte CDT = 5, SFI = 0;  // FRC register MPR121_CONFIG2 XXXYYZZZ
    byte touchThreshold = 9, releaseThreshold = 6;
    byte touchDebounce = 0, releaseDebounce = 0; // Debounce register MPR121_DEBOUNCE 0-7 : XTTTXRRR
    byte MHD[2], NHD[2], NCL[2], FDL[2];
    WifiMode wifiMode;
    ThresholdMode thresholdMode=CROSS;
    char apPW[MAXPWSIZE]="calibMpr121";
};

Configuration config;

#define NUMCONFKEYS 12
String configKeys[NUMCONFKEYS] = {"customTouchThreshold", "customReleaseThreshold", "FFI", "CDC", "CDT", "SFI", "touchThreshold", "touchDebounce","releaseThreshold", "releaseDebounce", "Rising", "Falling"};



bool wifiConnected = false;
bool serverStarted = false;
bool startSensor = false;
bool sensorStarted = false;
bool calibrationMode = false;
long startTime;