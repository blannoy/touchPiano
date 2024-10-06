from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
import pprint
from threading import Thread
import pyautogui
import time
from pyKey import press


baseUrl='http://192.168.0.38'
baseUrl='http://192.168.4.1'
endKey=4
pianoEventsUrl = baseUrl+'/api/piano'
pianoControl=baseUrl+'/api/pianoState?mode=piano&start='
pianoKeyboard=[
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'
];
pyautogui.PAUSE = 0.05

def playKey(key):
  #  pyautogui.press(pianoKeyboard[key])
    press(key=pianoKeyboard[key],sec=0)    
async def treatEvents():
    print("using ",pianoEventsUrl)
    event_source = sse_client.EventSource(pianoEventsUrl)
    async with event_source:
        try:
            async for event in event_source:
                eventData=json.loads(event.data)
                keyHit=eventData["keyHit"]
                for i in range(len(keyHit)):
                #print("Hit ",i," ",keyHit[i])
                    if (keyHit[i]==True):
                        print(pianoKeyboard[i],end=" ")
                        thread = Thread(target=playKey, args=(i,))
                        thread.start()
                        thread.join()
                        if (i==endKey):
                            print()
                            print("Piano stopped")
                            stopPiano=requests.get(pianoControl+"false")
                            exit()
        except ConnectionError:
            print("Connection error")
        except KeyboardInterrupt:
            await event_source.close()


startPiano=requests.get(pianoControl+"true")
pianoResponse=json.loads(startPiano.content)

if (pianoResponse["start"] == True):
    print("Piano started")
else:
    print("Cannot start piano")
    exit()
try:
    asyncio.run(treatEvents())
except KeyboardInterrupt:
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")
# task.cancel()
# loop.close()