#pragma once

WiFiManager wifiManager;

void APModeCallback(WiFiManager *myWiFiManager)
{
  Serial.println("Entered config mode");
  wifiConnected = false;
  stopServer();
  serverStarted = false;
}

void wifiManagerSetup()
{
  wifiManager.setAPCallback(APModeCallback);
  wifiManager.setConnectTimeout(180);

  WiFi.mode(WIFI_STA);
  wifiManager.setShowStaticFields(true);
  wifiManager.setShowDnsFields(true);


  bool res;
  res = wifiManager.autoConnect(ssid);
  if (!res)
  {
    Serial.println("Failed to connect");
  }
  else
  {
    if (MDNS.begin(ssid))
    {
      Serial.println("MDNS responder started");
    }
  }
  // save the custom parameters to FS
}
void wifiManagerLoop()
{
  // wifiManager.process();

  if (WiFi.status() == WL_CONNECTED && !wifiConnected)
  {
    Serial.println("WIFI OK");
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