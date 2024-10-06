from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
import pprint
from pypiano import Piano
from threading import Thread

baseUrl='http://192.168.0.38'
baseUrl='http://192.168.4.1'
pianoEventsUrl = baseUrl+'/api/piano'
pianoControl=baseUrl+'/api/pianoState?mode=piano&start='
pianoNotes=[
  'C-4', 'C#-4', 'D-4', 'D#-4', 'E-4', 'F-4', 'F#-4', 'G-4', 'G#-4', 'A-4', 'A#-4', 'B-4',
  'C-5', 'C#-5', 'D-5', 'D#-5', 'E-5', 'F-5', 'F#-5', 'G-5', 'G#-5', 'A-5', 'A#-5', 'B-5'
];
p = Piano(audio_driver="alsa")

def playNote(key):
    p.play(pianoNotes[key])
    
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
                        print(i)
                        thread = Thread(target=playNote, args=(i,))
                        thread.start()
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