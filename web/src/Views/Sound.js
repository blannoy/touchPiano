import { SplendidGrandPiano } from "smplr";
import { AudioContext } from "standardized-audio-context";
import { useState, useEffect, useContext, useRef } from 'react';
import { configContext, queryProviderContext } from "../Context/Context";
import { RotatingLines } from "react-loader-spinner";

export default function Sound() {
  const [config, setConfig] = useContext(configContext);
  const [requestState, dispatchRequest] = useContext(queryProviderContext);
  const [start, setStart] = useState(false);
  const [keyStates, setKeyStates] = useState(Array(24).fill(""));
  const [piano,setPiano] = useState();

  useEffect(() => {
    if (config !== null && config !== undefined) {
      setStart(config.start);
      setPiano(new SplendidGrandPiano(new AudioContext(),{baseUrl:"/grand-piano/samples"}));
    }
  }, [config])
  function doClick(e){
    piano.start({ note: "C4" });
  }

    return (
    <>
      {(config === null || config === undefined) ?
        <RotatingLines
          strokeColor="grey"
          strokeWidth="5"
          animationDuration="0.75"
          width="96"
          visible={true}
        /> :
        <div>
          <div className='section'>
            <button type="submit" id="start" onClick={doClick}>Play</button>
          </div>

        </div>}
    </>
  );
};
