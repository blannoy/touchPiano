import json
import pprint
import sseclient
import requests

from mingus.core import notes, chords
from mingus.containers import *
from mingus.midi import fluidsynth
from os import sys

SF2 = "soundfonts\\FluidR3_GM.sf2"
WHITE_KEYS = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
]
BLACK_KEYS = ["C#", "D#", "F#", "G#", "A#"]
channel = 8

if not fluidsynth.init(SF2):
    print("Couldn't load soundfont", SF2)
    sys.exit(1)

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
        fluidsynth.play_Note(Note("C-5"), channel, 100)
except KeyboardInterrupt:
    client.close()
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")
