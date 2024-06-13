#pragma once
#include <AsyncJson.h>
AsyncEventSource calibrationEvents("/api/readings");
AsyncEventSource thresholdEvents("/api/thresholds");
AsyncEventSource pianoEvents("/api/piano");

void sendResponse(int code, const char *content_type, const char *message, AsyncWebServerRequest *request)
{
  AsyncWebServerResponse *response = request->beginResponse(code, content_type, message);
  // response->addHeader("Access-Control-Allow-Origin", "*");
  response->addHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS");
  response->addHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With");
  request->send(response);
}

String webserverGetContentType(String filename)
{
  if (filename.endsWith(".htm"))
    return "text/html";
  else if (filename.endsWith(".html"))
    return "text/html";
  else if (filename.endsWith(".css"))
    return "text/css";
  else if (filename.endsWith(".js"))
    return "application/javascript";
  else if (filename.endsWith(".svg"))
    return "image/svg+xml";
  else if (filename.endsWith(".png"))
    return "image/png";
  else if (filename.endsWith(".gif"))
    return "image/gif";
  else if (filename.endsWith(".jpg"))
    return "image/jpeg";
  else if (filename.endsWith(".ico"))
    return "image/x-icon";
  else if (filename.endsWith(".xml"))
    return "text/xml";
  else if (filename.endsWith(".pdf"))
    return "application/x-pdf";
  else if (filename.endsWith(".zip"))
    return "application/x-zip";
  else if (filename.endsWith(".gz"))
    return "application/x-gzip";
  return "text/html";
}
void sendOptions(AsyncWebServerRequest *request)
{
  AsyncWebServerResponse *response = request->beginResponse(204);
  // response->addHeader("Access-Control-Max-Age", "10000");
  // response->addHeader("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS");
  // response->addHeader("Access-Control-Allow-Headers", "*");
  request->send(response);
}
bool webserverServeFileFromFS(AsyncWebServerRequest *request)
{
  String path = request->url();
  // debug_printf("handleFileRead: %s (%d)\n", path.c_str(), path.length());
  Serial.printf("handleFileRead: %s (%d) method %s\n", path.c_str(), path.length(), request->methodToString());
  if (strcmp(request->methodToString(), "OPTIONS") == 0)
  {
    sendOptions(request);
    // AsyncWebServerResponse *response = request->beginResponse(204);
    // // response->addHeader("Access-Control-Max-Age", "10000");
    // // response->addHeader("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS");
    // // response->addHeader("Access-Control-Allow-Headers", "*");
    // request->send(response);
    return true;
  }
  else
  {
    if (path.length() == 0)
      path = "/index.html";
    if (path.endsWith("/"))
      path += "index.html";

    String content_type = webserverGetContentType(path);
    String compressed_path = path + ".gz";
    if (LittleFS.exists(compressed_path) || LittleFS.exists(path))
    {
      if (LittleFS.exists(compressed_path))
        path += ".gz";
      //    File file = LittleFS.open(path, "r");
      AsyncWebServerResponse *response = request->beginResponse(LittleFS, path.c_str(), content_type);
      request->send(response);
      //    file.close();
      //  debug_printf("sent file: %s with size %d\n", path.c_str(), sent);
      //  debug_print("\tSent file:");
      //  debug_println(path);
      return true;
    }
    // debug_printf("\tFile Not Found: %s\n", path.c_str());
    return false;
  }
}

void handleNotFound(AsyncWebServerRequest *request)
{
  if (strcmp(request->methodToString(), "OPTIONS") == 0)
  {
    sendOptions(request);
  }
  else if (!webserverServeFileFromFS(request))
  {
    String message = "File Not Found\n\n";
    message += "URI: ";
    message += request->url();
    message += "\nMethod: ";
    message += (request->method() == HTTP_GET) ? "GET" : "POST";
    message += "\nArguments: ";
    message += request->args();
    message += "\n";
    for (uint8_t i = 0; i < request->args(); i++)
    {
      message += " " + request->argName(i) + ": " + request->arg(i) + "\n";
    }
    request->send(404, "text/plain", message);
  }
}

void dumpLittleFS()
{
  Dir dir = LittleFS.openDir("");
  while (dir.next())
  {
    Serial.printf("%s, (%d)\n", dir.fileName().c_str(), dir.fileSize());
    //  debug_printf("%s, (%d)\n", dir.fileName().c_str(), dir.fileSize());
  }
}

void getConfig(AsyncWebServerRequest *request)
{
  JsonDocument doc;
  doc = config2JSON(&config);
  doc["start"] = startSensor;
  String message;
  serializeJson(doc, message);
  sendResponse(200, "application/json", message.c_str(), request);
}

void setConfig(AsyncWebServerRequest *request, JsonObject data)
{
  if (request->hasParam("start"))
  {
    AsyncWebParameter *p = request->getParam("start");
    startSensor = p->value().equalsIgnoreCase("true");
  }
  if (request->hasParam("mode"))
  {
    AsyncWebParameter *p = request->getParam("mode");
    runMode = p->value();
  }
  JSON2config(data, &config, true);
  getConfig(request);
}

void setWifiMode(AsyncWebServerRequest *request)
{
  if (request->hasParam("mode"))
  {
    AsyncWebParameter *p = request->getParam("mode");
    if (p->value().equalsIgnoreCase("CLIENT"))
    {
      config.wifiMode = CLIENT;
    }
    else if (p->value().equalsIgnoreCase("AP"))
    {
      if (request->hasParam("PW")){
            AsyncWebParameter *pw = request->getParam("PW");
        config.wifiMode = AP;
       String pwVal=pw->value();
        strlcpy(config.apPW,pwVal.c_str(),min(MAXPWSIZE,int(strlen(pwVal.c_str())+1)));
      } else {
        sendResponse(400,"text/plain","Missing PW",request);
        return;
      }
    }
    else if (p->value().equalsIgnoreCase("RESET"))
    {
      wifiManager.resetSettings();
    }
  }
  saveConfiguration(config);
  sendResponse(200,"text/plain","Restarting",request);
  delay(2000);
  ESP.restart();
}

void setState(AsyncWebServerRequest *request)
{
  if (request->hasParam("mode"))
  {
    AsyncWebParameter *p = request->getParam("mode");
    runMode = p->value();
  }
  if (request->hasParam("start"))
  {
    AsyncWebParameter *p = request->getParam("start");
    startSensor = p->value().equalsIgnoreCase("true");
  }

  getConfig(request);
}

void setThresholdMode(AsyncWebServerRequest *request)
{
  if (request->hasParam("mode"))
  {
    AsyncWebParameter *p = request->getParam("mode");
      if (p->value().equalsIgnoreCase("STANDARD"))
    {
      config.thresholdMode = STANDARD;
    } else if (p->value().equalsIgnoreCase("CROSS")) {
      config.thresholdMode = CROSS;
    }
  }
  getConfig(request);
}
void setThresholds(AsyncWebServerRequest *request, JsonObject data)
{
  copyArray(data["customTouchThreshold"], config.customTouchThreshold);
  copyArray(data["customReleaseThreshold"], config.customReleaseThreshold);
  getConfig(request);
}

void webServerSetup()
{
  Serial.println("Webserver setup");
  if (!serverStarted)
  {
    // dumpLittleFS();
    // server.on("/", handleRoot);
    // server.enableCORS(true);
    server.serveStatic("/", LittleFS, "/");
    server.serveStatic("/static/css", LittleFS, "/static/css");
    server.serveStatic("/static/js", LittleFS, "/static/js");

    server.on("/api/config", HTTP_GET, getConfig);
    server.on("/api/pianoState", HTTP_GET, setState);
    server.on("/api/wifiMode", HTTP_GET, setWifiMode);
    server.on("/api/thresholdMode", HTTP_GET, setThresholdMode);
    server.addHandler(new AsyncCallbackJsonWebHandler(
        "/api/setReg",
        [](AsyncWebServerRequest *request, JsonVariant &json)
        {
          if (request->methodToString() == "GET")
          {
            getConfig(request);
          }
          else if (request->methodToString() == "POST")
          {
            if (not json.is<JsonObject>())
            {
              request->send(400, "text/plain", "Not an object");
              return;
            }
            auto &&data = json.as<JsonObject>();
            setConfig(request, data);
          }
        }));

    server.addHandler(new AsyncCallbackJsonWebHandler(
        "/api/thresholds",
        [](AsyncWebServerRequest *request, JsonVariant &json)
        {
          if (strcmp(request->methodToString(), "POST") == 0)
          {
            if (not json.is<JsonObject>())
            {
              request->send(400, "text/plain", "Not an object");
              return;
            }
            auto &&data = json.as<JsonObject>();
            setThresholds(request, data);
          }
        }));

    calibrationEvents.onConnect([](AsyncEventSourceClient *client)
                                {
                                  if (client->lastId())
                                  {
                                    Serial.printf("Client reconnected to calibration! Last message ID that it got is: %u\n", client->lastId());
                                  }
                                  // client->send("hello!", NULL, millis(), 1000); });
                                });
    pianoEvents.onConnect([](AsyncEventSourceClient *client)
                          {
                            if (client->lastId())
                            {
                              Serial.printf("Client reconnected to piano! Last message ID that it got is: %u\n", client->lastId());
                            }
                            // client->send("hello!", NULL, millis(), 1000); });
                          });
    thresholdEvents.onConnect([](AsyncEventSourceClient *client)
                              {
                                if (client->lastId())
                                {
                                  Serial.printf("Client reconnected to threshold! Last message ID that it got is: %u\n", client->lastId());
                                }
                                // client->send("hello!", NULL, millis(), 1000); });
                              });

    server.addHandler(&calibrationEvents);
    server.addHandler(&pianoEvents);
    server.addHandler(&thresholdEvents);
    server.onNotFound(handleNotFound);
    Serial.println("HTTP server started\n");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Request-Private-Network", "true");
    server.begin();
    // Serial.println("HTTP server started\n");
    serverStarted = true;
  }
}

void stopServer()
{
  server.end();
}
/*
void getLog(){
  flushLog();
  String message(logBufferString);
  server.send(200,"text/plain",message);
}*/

void webServerLoop()
{
  if (serverStarted)
  {
    //  server.handleClient();
    MDNS.update();
  }
}
