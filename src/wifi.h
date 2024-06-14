#pragma once

WiFiManager wifiManager;

void APModeCallback(WiFiManager *myWiFiManager)
{
  Serial.println("Entered config mode");
  wifiConnected = false;
  // setStatusLeds();
  stopServer();
  serverStarted = false;
}

void wifiManagerSetup()
{
  wifiManager.setAPCallback(APModeCallback);
  // wifiManager.setConfigPortalBlocking(false);
  wifiManager.setConnectTimeout(180);
  // set static ip
  WiFi.mode(WIFI_STA);
  // WiFi.setPhyMode(WIFI_PHY_MODE_11G);
  // delay(5000);
  wifiManager.setShowStaticFields(true);
  wifiManager.setShowDnsFields(true);
  // wifiManager.resetSettings();

  bool res;
  res = wifiManager.autoConnect(ssid);
  if (!res)
  {
    Serial.println("Failed to connect");
    // statusLed(WIFI, red);
    // wifiConnected=false;
    // wifiManager.resetSettings();
    // ESP.restart();
    // return;
    //  debug_print("Failed to connect");
    // ESP.restart();
  }
  else
  {
    // if you get here you have connected to the WiFi
    //   debug_println("connected...yeey :)");
    // statusLed(WIFI,green);
    // wifiConnected=true;
    if (MDNS.begin(ssid))
    {
      Serial.println("MDNS responder started");
      // debug_println("MDNS responder started");
    }
  }
  // save the custom parameters to FS
}
void wifiManagerLoop()
{
  // wifiManager.process();

  if (WiFi.status() == WL_CONNECTED && !wifiConnected)
  {
    //  debug_println("WIFI OK");
    Serial.println("WIFI OK");
    // TODO setStatusLeds();
    wifiConnected = true;
    webServerSetup();
  }
}

void wifiAPSetup(){
  WiFi.mode(WIFI_AP);
  Serial.printf("Wifi pw is %s\n",config.apPW);
  WiFi.softAP(ssid, config.apPW);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);
}



void wifiAPLoop()
{
}

// void configWifi()
// {
//   server.send(200, "text/plain", "Starting wifi config portal");
//   wifiManager.resetSettings();
//   /*  if (LittleFS.exists("/config.json")) {
//       LittleFS.remove("/config.json");
//      }*/
//   ESP.restart();
//   delay(5000);
// }
void wifiSetup(){
  Serial.printf("Wifimode is %s\n",wifiModeString[config.wifiMode].c_str());
  if (config.wifiMode == AP){
    wifiAPSetup();  
  } else if (config.wifiMode == CLIENT){
    wifiManagerSetup();
  }
}
void wifiLoop(){
  if (config.wifiMode == AP){
    wifiAPLoop();
  } else if (config.wifiMode == CLIENT){
    wifiManagerLoop();
}
}