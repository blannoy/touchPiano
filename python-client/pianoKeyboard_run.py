from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
import pprint
from threading import Thread
import pyautogui
import time
from pyKey import press
import sys
import tkinter as tk
import tkinter.ttk as ttk
from tkinter.constants import *

import pianoKeyboard

def playKey(key):
  #  pyautogui.press(pianoKeyboard[key])
    press(key=pianoKeys[key],sec=0)    
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
                        print(pianoKeys[i],end=" ")
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

def main(*args):
    '''Main entry point for the application.'''
    
    global baseUrl, endKey,pianoEventsUrl, pianoControl, pianoKeys
    baseUrl='http://192.168.0.38'
    baseUrl='http://192.168.4.1'
    endKey=4
    pianoEventsUrl = baseUrl+'/api/piano'
    pianoControl=baseUrl+'/api/pianoState?mode=piano&start='
    pianoKeys=[
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
      'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'
    ];
    pianoKeyboard.gotoUrl.set(baseUrl)
    pianoKeyboard.Toplevel2.stopButton.configure(state=DISABLED)
    pianoKeyboard.Toplevel2.startButton.configure(state=NORMAL)
    
    global root
    root = tk.Tk()
    root.protocol( 'WM_DELETE_WINDOW' , root.destroy)
    # Creates a toplevel widget.
    global _top2, _w2
    _top2 = root
    _w2 = pianoKeyboard.Toplevel2(_top2)
    


    root.mainloop()
    
def send_start(*args):
    if _debug:
        print('pianoKeyboard_support.send_start')
        for arg in args:
            print ('    another arg:', arg)
        sys.stdout.flush()
    startPiano=requests.get(pianoControl+"true")
    pianoResponse=json.loads(startPiano.content)

    if (pianoResponse["start"] == True):
        print("Piano started")
    else:
        print("Cannot start piano")
        exit()
    try:
        asyncio.run(treatEvents())
    except:
        print("Error")
        
def send_stop(*args):
    if _debug:
        print('pianoKeyboard_support.send_stop')
        for arg in args:
            print ('    another arg:', arg)
        sys.stdout.flush()
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")
        
if __name__ == '__main__':
    pianoKeyboard.start_up()
