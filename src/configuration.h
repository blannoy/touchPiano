#pragma once
#include <Arduino.h>
#include <headers.h>
bool validJSON = true;

void loadDefaultConfiguration()
{
  for (int i = 0; i < NUMKEYS; i++)
  {
    config.customTouchThreshold[i] = config.touchThreshold;
    config.customReleaseThreshold[i] = config.releaseThreshold;
  }
}

JsonDocument config2JSON(Configuration *conf)
{
  JsonDocument doc;
  doc["FFI"] = config.FFI;
  doc["CDC"] = config.CDC;
  doc["CDT"] = config.CDT;
  doc["SFI"] = config.SFI;
  doc["touchThreshold"] = config.touchThreshold;
  doc["releaseThreshold"] = config.releaseThreshold;
  doc["touchDebounce"] = config.touchDebounce;
  doc["releaseDebounce"] = config.releaseDebounce;
  doc["Rising"]["MHD"] = config.MHD[0];
  doc["Rising"]["NHD"] = config.NHD[0];
  doc["Rising"]["NCL"] = config.NCL[0];
  doc["Rising"]["FDL"] = config.FDL[0];
  doc["Falling"]["MHD"] = config.MHD[1];
  doc["Falling"]["NHD"] = config.NHD[1];
  doc["Falling"]["NCL"] = config.NCL[1];
  doc["Falling"]["FDL"] = config.FDL[1];
  copyArray(config.customTouchThreshold, doc["customTouchThreshold"]);
  copyArray(config.customReleaseThreshold, doc["customReleaseThreshold"]);
  doc["wifiMode"] = wifiModeString[config.wifiMode];
  doc["thresholdMode"] = thresholdModeString[config.thresholdMode];
  doc["autoRelease"]=config.autoRelease;
  doc["averagePeriod"]=config.averagePeriod;
  return doc;
}
void saveConfiguration(Configuration &conf)
{
  JsonDocument json;
  debug_println(F("Need to save configuration to Filesystem"));
  File configFile = LittleFS.open("/config.json", "w");
  json = config2JSON(&conf);
  json["APPW"] = config.apPW;
  serializeJson(json, configFile);
  configFile.close();
  debug_println(F("Closed file"));
}
bool JSON2config(const JsonDocument doc, Configuration *conf, boolean save)
{

  bool validJSON = true;
  // debug_println(json[F("system")][F("ntp_server")].as<String>());
  for (uint8_t i = 0; i < NUMCONFKEYS; i++)
  {
    if (!doc.containsKey(configKeys[i]))
    {
      debug_print(F("Missing key "));
      debug_println(configKeys[i]);
      validJSON = false;
    }
  }
  if (validJSON)
  {
    config.CDC = doc["CDC"];
    config.FFI = doc["FFI"];
    config.CDT = doc["CDT"];
    config.SFI = doc["SFI"];

    config.touchThreshold = doc["touchThreshold"];
    config.releaseThreshold = doc["releaseThreshold"];
    config.touchDebounce = doc["touchDebounce"];
    config.releaseDebounce = doc["releaseDebounce"];

    config.MHD[0] = doc["Rising"]["MHD"];
    config.MHD[1] = doc["Falling"]["MHD"];
    config.NHD[0] = doc["Rising"]["NHD"];
    config.NHD[1] = doc["Falling"]["NHD"];
    config.NCL[0] = doc["Rising"]["NCL"];
    config.NCL[1] = doc["Falling"]["NCL"];
    config.FDL[0] = doc["Rising"]["FDL"];
    config.FDL[1] = doc["Falling"]["FDL"];
    copyArray(doc["customTouchThreshold"], config.customTouchThreshold);
    copyArray(doc["customReleaseThreshold"], config.customReleaseThreshold);
    if (doc.containsKey("wifiMode"))
    {
      if (doc["wifiMode"].as<String>().equalsIgnoreCase("CLIENT"))
      {
        config.wifiMode = CLIENT;
      }
      else if (doc["wifiMode"].as<String>().equalsIgnoreCase("AP"))
      {
        config.wifiMode = AP;
      }
    }
    if (doc.containsKey("thresholdMode"))
    {
      if (doc["thresholdMode"].as<String>().equalsIgnoreCase("STANDARD"))
      {
        config.thresholdMode = STANDARD;
      }
      else if (doc["thresholdMode"].as<String>().equalsIgnoreCase("CROSS"))
      {
        config.thresholdMode = CROSS;
      }
    }
    if (doc.containsKey("autoRelease"))
    {
      config.autoRelease=doc["autoRelease"].as<int>();
    }
        if (doc.containsKey("averagePeriod"))
    {
      config.averagePeriod=doc["averagePeriod"].as<int>();
    }
  }
  else
  {
    debug_println(F("Invalid JSON config"));
    return false;
  }

  if (save)
  {
    saveConfiguration(config);
  }
  return true;
}

void printConfig(Configuration conf)
{
  JsonDocument json;
  json = config2JSON(&conf);
  serializeJson(json, Serial);
}

void loadConfiguration(Configuration *conf)
{
  JsonDocument json;
  debug_println(F("Loading configuration from filesystem"));
  validJSON = false;
  File configFile = LittleFS.open("/config.json", "r");
  if (configFile)
  {
    Serial.println(F("opened config file"));
    auto deserializeError = deserializeJson(json, configFile);
    configFile.close();
    if (!deserializeError)
    {
      // serializeJson(json,Serial);
      // serializeJsonPretty(json, Serial);
      validJSON = true;
      JSON2config(json, conf, false);
      if (json.containsKey("APPW"))
      {
        const char *pw = json["APPW"].as<const char *>();
        Serial.printf("Got PW from file: %s\n", pw);
        strlcpy(config.apPW, pw, min(MAXPWSIZE, int(strlen(pw)) + 1));
        Serial.printf("Set PW: %s\n", config.apPW);
      }
    }
    else
    {
      debug_println(deserializeError.c_str());
      debug_println(F("failed to load json config"));
    }
  }
  else
  {
    debug_println(F("Cannot open config file"));
  }

  if (!validJSON)
  {
    debug_println(F("Invalid JSON"));
    Serial.println(F("Invalid JSON"));
    // loadDefaultConfiguration();
  }

  // copyConfig(config, oldConfig);
}

void configurationSetup()
{
  loadConfiguration(&config);
}
