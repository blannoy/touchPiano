from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
from threading import Thread
from pyKey import press, pressKey, releaseKey
import sys
import time
import tkinter as tk
import tkinter.ttk as ttk
from tkinter.constants import *
import validators

_bgcolor = '#d9d9d9'
_fgcolor = '#000000'
_tabfg1 = 'black' 
_tabfg2 = 'white' 
_bgmode = 'light' 
_tabbg1 = '#d9d9d9' 
_tabbg2 = 'gray40' 

previousKeyState=[]

_debug=True

def is_valid_url(url):
    return validators.url(url)

def playKey(key,continuous):
  if (continuous):
    pressKey(key=pianoKeys[key])
  else:
    press(key=pianoKeys[key],sec=0)

def stopKey(key):
  #  pyautogui.press(pianoKeyboard[key])
    releaseKey(key=pianoKeys[key])

async def treatEvents():
    eventsURL=gotoURL.get()+pianoEventsUrl.get()
    endKey=stopLetter.get()
    print("using ",eventsURL)
    event_source = sse_client.EventSource(eventsURL)
    async with event_source:
        try:
            async for event in event_source:
                eventData=json.loads(event.data)
                keyHit=eventData["keyHit"]
                keyState=eventData["keyState"];
                #turn of released keys
                global previousKeyState
                if (len(previousKeyState)==len(keyState)):
                    for i in range(len(keyState)):
                        if (keyState[i]!=previousKeyState[i]) and (keyState[i]==False):
                            thread = Thread(target=stopKey, args=(i,))
                            thread.start()

                previousKeyState=keyState
                for i in range(len(keyHit)):
                #print("Hit ",i," ",keyHit[i])
                    if (keyHit[i]==True):
                        print(pianoKeys[i],end=" ")
                        thread = Thread(target=playKey, args=(i,continuousState.get()))
                        thread.start()
                        if (i==stopLetter.current()):
                            send_stop()
                            releaseAllKeys()
                            exit()
        except ConnectionError:
            print("Connection error")
        except KeyboardInterrupt:
            await event_source.close()
            releaseAllKeys()

def send_start():
    #input validation
    ErrorLabel.config(text="",foreground="red")
    if (not validateForm()):
        return

    if _debug:
        print('pianoKeyboard_support.send_start')
        print('URL is ', gotoURL.get() )
        sys.stdout.flush()

    try:
        # if continuous state, set key autorelease to 60s else set to 5s
        if (continuousState.get()):
            setContinuousTimeOut=requests.get(gotoURL.get()+pianoAutoReleaseTimeout.get()+"60000",timeout=2)
        else:
            setContinuousTimeOut=requests.get(gotoURL.get()+pianoAutoReleaseTimeout.get()+"5000",timeout=2)
 
        startPiano=requests.get(gotoURL.get()+pianoControl.get()+"true",timeout=2)
        pianoResponse=json.loads(startPiano.content)

        if (pianoResponse["start"] == True):
            print("Piano started")

            startButton.config(state=tk.DISABLED)
            stopButton.config(state=tk.NORMAL)
            ErrorLabel.config(text="Piano started", foreground="black")
            time.sleep(1)
        else:
            print("Cannot start piano")
            ErrorLabel.config(text="Cannot start piano")
        try:
            thread = Thread(target=asyncio.run, args=(treatEvents(),))
            thread.start()
            #asyncio.run(treatEvents())
        except Exception as e:
            print("Error",e)
    except requests.ConnectTimeout as e:
        print("Cannot start piano",e)
        ErrorLabel.config(text="Kan piano niet bereiken")
    except Exception as e:
        print("Cannot start piano",e)
        
def send_stop():
    if _debug:
        print('pianoKeyboard_support.send_stop')
        print('URL is ', gotoURL.get() )
        sys.stdout.flush()

    try:
        startPiano=requests.get(gotoURL.get()+pianoControl.get()+"false",timeout=2)
        pianoResponse=json.loads(startPiano.content)

        if (pianoResponse["start"] == False):
            print("Piano stopped")
            startButton.config(state=tk.NORMAL)
            stopButton.config(state=tk.DISABLED)
            ErrorLabel.config(text="Piano stopped", foreground="black")

        else:
            print("Cannot stop piano")
            ErrorLabel.config(text="Cannot stop piano", foreground="red")    
    except:
        print("Cannot stop piano")
        

baseUrl='http://192.168.0.38'
baseUrl='http://192.168.4.1'


pianoKeys=[
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'
];

def validateForm():
    return (guiValidateURL()==True) and (guiValidateStopKey()==True)

def guiValidateURL():
    if (not is_valid_url(gotoURL.get())):
        ErrorLabel.config(text="Ongeldige URL")
        return False
    return True

def guiValidateStopKey():
    if (stopLetter.get()==""):
        ErrorLabel.config(text="Kies een stopletter")
        return False
    return True

def releaseAllKeys():
    for i in range(len(pianoKeys)):
        releaseKey(key=pianoKeys[i])

root = tk.Tk()
root.protocol( 'WM_DELETE_WINDOW' , root.destroy)
root.geometry("568x274+430+159")
root.minsize(1, 1)
root.maxsize(1351, 738)
root.resizable(1,  1)
root.title("Piano keyboard")
window = root
gotoURL = tk.StringVar(window)
continuousState = tk.BooleanVar(window)
pianoControl=tk.StringVar(window,'/api/pianoState?mode=piano&start=')
pianoAutoReleaseTimeout=tk.StringVar(window,'/api/autoRelease?value=')
pianoEventsUrl = tk.StringVar(window,'/api/piano')
Label1 = tk.Label(window)
Label1.place(relx=0.088, rely=0.08, height=13, width=37)
Label1.configure(activebackground="#d9d9d9")
Label1.configure(anchor='w')
Label1.configure(compound='left')
Label1.configure(font="-family {DejaVu Sans} -size 10")
Label1.configure(text='''URL''')

URL = tk.Entry(window)
URL.place(relx=0.211, rely=0.036, height=33, relwidth=0.68)
URL.configure(background="white")
URL.configure(font="-family {DejaVu Sans Mono} -size 10")
URL.configure(selectbackground="#d9d9d9")
URL.configure(textvariable=gotoURL)
URL.configure(validatecommand=guiValidateURL,validate="focusout")

Label2 = tk.Label(window)
Label2.place(relx=0.053, rely=0.219, height=26, width=75)
Label2.configure(activebackground="#d9d9d9")
Label2.configure(anchor='w')
Label2.configure(compound='left')
Label2.configure(font="-family {DejaVu Sans} -size 10")
Label2.configure(text='''Stop key''')

stopLetter = ttk.Combobox(window)
stopLetter.place(relx=0.211, rely=0.219, relheight=0.099, relwidth=0.312)
stopLetter.configure(font="-family {DejaVu Sans} -size 10")
stopLetter.configure(validatecommand=guiValidateStopKey,validate="focusout")
stopLetter.config(values=pianoKeys)
stopLetter.current(4)

continuous = tk.Checkbutton(window)
continuous.place(relx=0.194, rely=0.365, relheight=0.146, relwidth=0.412)
continuous.configure(activebackground="#d9d9d9")
continuous.configure(anchor='w')
continuous.configure(compound='left')
continuous.configure(font="-family {DejaVu Sans} -size 10")
continuous.configure(justify='left')
continuous.configure(text='''Toets continu''')
continuous.configure(variable=continuousState)

startButton = tk.Button(window)
startButton.place(relx=0.07, rely=0.547, height=51, width=131)
startButton.configure(activebackground="#d9d9d9")
startButton.configure(font="-family {DejaVu Sans} -size 10")
startButton.configure(text='''Start''')


stopButton = tk.Button(window)
stopButton.place(relx=0.352, rely=0.547, height=51, width=131)
stopButton.configure(activebackground="#d9d9d9")
stopButton.configure(font="-family {DejaVu Sans} -size 10")
stopButton.configure(text='''Stop''')

ErrorLabel = tk.Label(window)
ErrorLabel.place(relx=0.035, rely=0.803, height=41, width=529)
ErrorLabel.configure(activebackground="#d9d9d9",foreground="red")
ErrorLabel.configure(anchor='center')
ErrorLabel.configure(font="-family {DejaVu Sans} -size 10")
ErrorLabel.configure(text="")

startButton.configure(command=send_start)
stopButton.configure(command=send_stop)
gotoURL.set(baseUrl)
continuousState.set(False)
stopButton.config(state=tk.DISABLED)
startButton.config(state=tk.NORMAL)

root.mainloop()




