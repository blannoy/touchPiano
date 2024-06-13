import json
import pprint
import sseclient
import requests
import re
from pypiano import Piano
from threading import Thread

def playNote(key):
    p.play(pianoNotes[key])
    
p = Piano(audio_driver="alsa")
pianoNotes=['C-4','C#-4','D-4','D#-4','E-4']
baseUrl='http://192.168.0.38'
pîanoEventsUrl = baseUrl+'/api/piano'
pianoControl=baseUrl+'/api/pianoState?mode=piano&start='

startPiano=requests.get(pianoControl+"true")
pianoResponse=json.loads(startPiano.content)
if (pianoResponse["start"] == True):
    print("Piano started")
else:
    print("Cannot start piano")
    exit()  

headers = {'Accept': 'text/event-stream'}
response =requests.get(pîanoEventsUrl, stream=True, headers=headers)
client = sseclient.SSEClient(response)
try:  
    print("Ctrl-C to stop")  
    for event in client.events():
        eventData=json.loads(event.data)
        keyHit=eventData["keyHit"]
        for i in range(len(keyHit)):
            if (keyHit[i]==True):
                print ("Hit ",i)
                
#        pprint.pprint(j)
#        thread = Thread(target=playNote, args=(2,))
#        thread.start()
except KeyboardInterrupt:
    client.close()
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")
