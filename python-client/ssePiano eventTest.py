import json
import pprint
import sseclient
import requests


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
        pprint.pprint(json.loads(event.data))
except KeyboardInterrupt:
    client.close()
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")
