import '../assets/css/piano.css'
import { useState, useEffect, useContext, useRef } from 'react';
import { configContext, queryProviderContext } from "../Context/Context";
import { RotatingLines } from "react-loader-spinner";
import { SplendidGrandPiano, Soundfont } from "smplr";
import { AudioContext } from "standardized-audio-context";

let audioContext = new AudioContext();
const pianoNotes = [
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
  "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5"
];

function Play() {
  const [config, setConfig] = useContext(configContext);
  const [requestState, dispatchRequest] = useContext(queryProviderContext);
  const [start, setStart] = useState(false);
  const [keyStates, setKeyStates] = useState(Array(24).fill(""));
  const [previousKeyStates, setPreviousKeyStates] = useState(Array(24).fill(""));
  const [keyHits, setKeyHits] = useState(Array(24).fill(""));
  const eventSource = useRef(undefined);
  const [piano, setPiano] = useState(undefined);
  const [pianoLoading, setPianoLoading] = useState("init");
  const [startOnly, setStartOnly] = useState(false);
  const [sustain, setSustain] = useState(true);
  //const instrumentList=[{"name": "piano", "filename":"acoustic_grand_piano-mp3.js"},{"name":"church organ","filename":"church_organ-mp3.js"},{"name":"steel drums","filename":"steel_drums-mp3.js"}];
  const [instrument, setInstrument] = useState("piano");
  const [instrumentList, setInstrumentList] = useState([]);

  const getSoundConfig = () => {
    fetch('sounds.json'
      , {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        setInstrumentList(myJson);
      });
  }

  useEffect(() => {
    if (config !== null && config !== undefined) {
      setStart(config.start);
      // get sound config
      getSoundConfig();
    }
  }, [config])

  useEffect(() => {
    // opening a connection to the server to begin receiving events from it
    const eventSource = new EventSource(process.env.REACT_APP_BASE_URL + "/piano");

    // attaching a handler to receive message events
    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      let keyState = eventData["keyState"];
      let keyHit = eventData["keyHit"];
      //          console.log(JSON.stringify(eventData));
      setKeyStates(
        keyState.map((value, index) => {
          return (value ? "active" : "");
        })
      )
      setKeyHits(keyHit);
    };
    // terminating the connection on component unmount
    return () => eventSource.close();
  }, []);
  function doSubmit() {
    if (!start) {
      setStartOnly(false);
      //const newPiano = new SplendidGrandPiano(audioContext,{baseUrl:"/sounds/grand-piano/samples"})
      let newPiano = null;
      const pickedInstrument = instrumentList.filter(function (item) { return item.name === instrument; })[0].filename;
      newPiano = new Soundfont(audioContext, { instrumentUrl: process.env.REACT_APP_SOUND_URL + pickedInstrument });
      setPiano(newPiano);
      setPianoLoading("loading");
      newPiano.load.then(() => {
        setPianoLoading("ready");
      });
    } else {
      piano.stop();
    }
    dispatchRequest({ type: 'MODE', params: { 'mode': 'piano', 'start': !start } });
  }
  function doStartOnly() {
    setStartOnly(true);
    dispatchRequest({ type: 'MODE', params: { 'mode': 'piano', 'start': !start } });
  }
  useEffect(() => {
    if (start && !startOnly) {
      keyHits.forEach((value, index) => {
        if (value && !previousKeyStates[index]) {
          audioContext.resume();
          piano.start({ note: pianoNotes[index] });
        }
      });
      if (!sustain) {
        keyStates.forEach((value, index) => {
          if (value !== previousKeyStates[index] && !keyHits[index]) {
            piano.stop(index + 60);
          }
        });
      }
      setPreviousKeyStates(keyStates);
    }

  }, [keyHits, keyStates]);
  function changeInstrument(e) {
    setInstrument(e.target.value);
  }
  function changeSustain(e) {
    setSustain(!sustain);
  }
  return (
    <>
      {process.env.REACT_APP_ENV === 'IMAGE' ? <div className='section'>
        Warning: running in image mode. If you don't have access to the internet, the pianosounds won't work.
      </div> : ""}
      {(config === null || config === undefined || pianoLoading === "loading") ?
        <RotatingLines
          strokeColor="grey"
          strokeWidth="5"
          animationDuration="0.75"
          width="96"
          visible={true}
        /> :
        <div>
          <div className='section'>
            <label>Instrument:</label>
            <select id="instruments" onChange={changeInstrument} value={instrument}>
              {instrumentList.map((it, index) => <option key={it.name} value={it.name}>{it.name}</option>)}
            </select>
          </div>
          <div className='section'>
            <div className='labelCell'>
              <button type="submit" id="start" onClick={doSubmit}>{(start ? "STOP" : "START")}</button>
            </div>
            <div className='labelCell'>
              <button type="submit" id="startonly" onClick={doStartOnly}>{(start ? "STOP" : "START without sound")}</button>
            </div>
            <div className='labelCell'></div>
            <label>Keep sound when releasing key</label><input type="checkbox" id="sustain" onChange={changeSustain} checked={sustain} />
          </div>
          {/* Piano from https://mczak.com/code/piano/ */}
          <ul className="piano">
            <li className="key">
              <span className={"white-key " + keyStates[0]} data-key="0" data-note="1C"></span>
              <span className={"black-key " + keyStates[1]} data-key="1" data-note="1Cs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[2]} data-key="2" data-note="1D"></span>
              <span className={"black-key " + keyStates[3]} data-key="3" data-note="1Ds"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[4]} data-key="4" data-note="1E"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[5]} data-key="5" data-note="1F"></span>
              <span className={"black-key " + keyStates[6]} data-key="6" data-note="1Fs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[7]} data-key="7" data-note="1G"></span>
              <span className={"black-key " + keyStates[8]} data-key="8" data-note="1Gs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[9]} data-key="9" data-note="2A"></span>
              <span className={"black-key " + keyStates[10]} data-key="10" data-note="2As"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[11]} data-key="11" data-note="2B"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[12]} data-key="12" data-note="2C"></span>
              <span className={"black-key " + keyStates[13]} data-key="13" data-note="2Cs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[14]} data-key="14" data-note="2D"></span>
              <span className={"black-key " + keyStates[15]} data-key="15" data-note="2Ds"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[16]} data-key="16" data-note="2E"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[17]} data-key="17" data-note="2F"></span>
              <span className={"black-key " + keyStates[18]} data-key="18" data-note="2Fs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[19]} data-key="19" data-note="2G"></span>
              <span className={"black-key " + keyStates[20]} data-key="20" data-note="2Gs"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[21]} data-key="21" data-note="3A"></span>
              <span className={"black-key " + keyStates[22]} data-key="22" data-note="3As"></span>
            </li>
            <li className="key">
              <span className={"white-key " + keyStates[23]} data-key="23" data-note="3B"></span>
            </li>
          </ul>
        </div>}
    </>
  );
};

export default Play;