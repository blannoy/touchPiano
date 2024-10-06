from pyKey import pressKey, releaseKey, press, sendSequence, showKeys
# alternative to pykey
# import pyautogui
from time import sleep
from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
baseUrl='http://192.168.0.38'
pianoEventsUrl = baseUrl+'/api/piano'
pianoControl=baseUrl+'/api/pianoState?mode=piano&start='
keyMap=['LEFT','UP','DOWN','RIGHT','SPACE','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s']

def pushKey(key):
    pressKey(keyMap[key])

def releaseKey(key):
    releaseKey(keyMap[key])
    
# showKeys() -> get all keys
async def treatEvents():
    print("using ",pianoEventsUrl)
    event_source = sse_client.EventSource(pianoEventsUrl)
    async with event_source:
        try:
            async for event in event_source:
                eventData=json.loads(event.data)
                keyHit=eventData["keyHit"]
                keyState=eventData["keyState"]
                for i in range(len(keyHit)):
                #print("Hit ",i," ",keyHit[i])
                    if (keyHit[i]==True):
                        print("Hit ",i," ",keyHit[i])
                        pushKey(i)
                for i in range(len(keyState)):
                #print("Hit ",i," ",keyHit[i])
                    if (keyState[i]==0):
                        releaseKey(i)
        except ConnectionError:
            print("Connection error")
        except KeyboardInterrupt:
            stopPiano=requests.get(pianoControl+"false")
            if (pianoResponse["start"] == False):
                print("Piano stopped")
            await event_source.close()


startPiano=requests.get(pianoControl+"true")
pianoResponse=json.loads(startPiano.content)
if (pianoResponse["start"] == True):
    print("Piano started")
else:
    print("Cannot start piano")
    exit()  
asyncio.run(treatEvents())
