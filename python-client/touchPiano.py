from aiohttp_sse_client2 import client as sse_client
import asyncio
import json
import requests
import pprint

loop = asyncio.new_event_loop()

baseUrl='http://192.168.0.38'
pîanoEventsUrl = baseUrl+'/api/piano'
pianoControl=baseUrl+'/api/pianoState?mode=piano&start='



async def treatEvents():
    event_source = sse_client.EventSource(pîanoEventsUrl)
    async with event_source:
        try:
            async for event in event_source:
                pprint.pprint(json.loads(event.data))
        except ConnectionError:
            pass
        except KeyboardInterrupt:
            await event_source.close()

async def main():
    startPiano=requests.get(pianoControl+"true")
    pianoResponse=json.loads(startPiano.content)
    if (pianoResponse["start"] == True):
        print("Piano started")
    else:
        print("Cannot start piano")
        exit()  
    key=input("Enter to stop")
    stopPiano=requests.get(pianoControl+"false")
    if (pianoResponse["start"] == False):
        print("Piano stopped")

    return "Done"

task=loop.create_task(treatEvents())
loop.run_until_complete(main())
task.cancel()
loop.close()