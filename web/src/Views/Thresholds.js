import React, { useState, useEffect, useRef, useContext } from 'react';
import { configContext, queryProviderContext } from "../Context/Context";
import { nrKeys } from '../Containers/Root.js';
import InputNumber from '../Components/InputNumber.js';

import {
  LineChart,
  ComposedChart,
  Area,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
} from "recharts";


function Thresholds() {
  const [config, setConfig] = useContext(configContext);
  const [requestState, dispatchRequest] = useContext(queryProviderContext);
  const [start, setStart] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [pausedPlotData, setPausedPlotData] = useState([]);
  const [selectedPin, setSelectedPin] = useState(0);
  const [touchAll, setTouchAll] = useState(25);
  const [releaseAll, setReleaseAll] = useState(12);
  const [touchThreshold, setTouchThreshold] = useState([]);
  const [releaseThreshold, setReleaseThreshold] = useState([]);
  const data = useRef([]);
  const eventSource = useRef(undefined);
  const numPoints = 256;
  const [pauseChart, setPauseChart] = useState(false);

  useEffect(() => {
    if (config !== undefined && config !== null) {
      setStart(config.start);
      setTouchThreshold(config.customTouchThreshold);
      setReleaseThreshold(config.customReleaseThreshold);
    }
  }, [config]);

  useEffect(() => {
    if (!pauseChart) {
      setPausedPlotData(plotData);
    }
  }, [plotData]);

  function onChange(id, value) {
    const [valueType, index] = id.split("_");
    let newArray = [];
    switch (valueType) {
      case "touch":
        if (index === "all") {
          setTouchAll(value);
        } else {
          newArray = touchThreshold;
          newArray[index] = value;
          setTouchThreshold(newArray);
        }

        break;
      case "release":

        if (index === "all") {
          setReleaseAll(value);
        } else {
          newArray = releaseThreshold;
          newArray[index] = value;
          setReleaseThreshold(newArray);
        }

        break;

      default:
        break;
    }
    // console.log(id + " = " + value);
  }
  function changePin(e) {
    setSelectedPin(e.target.value);
  }

  function setThresholds(e) {
    e.preventDefault();
    let params = {
      ...config,
      "customTouchThreshold": touchThreshold,
      "customReleaseThreshold": releaseThreshold
    };
    dispatchRequest({ type: 'SETCONFIG', method: 'post', body: { ...params } });
  }

  function fillTouchThresholds() {
    setTouchThreshold(Array(nrKeys).fill(touchAll));
  }
  function fillReleaseThresholds() {
    setReleaseThreshold(Array(nrKeys).fill(releaseAll));
  }
  function toggleStart(e) {
    e.preventDefault();
    dispatchRequest({ type: 'MODE', params: { 'mode': 'thresholds', 'start': !start } });
    if (!start) {
      eventSource.current = new EventSource(process.env.REACT_APP_BASE_URL + "/thresholds");

      // attaching a handler to receive message events
      eventSource.current.onmessage = (event) => {
        let eventData = JSON.parse(event.data);
        let newDataArray = [
          ...data.current,
          { ...eventData }
        ];
        data.current = limitData(newDataArray);
        setPlotData(data.current);
      };
    } else {
      eventSource.current.close();
    }
  }
  function limitData(currentData) {
    if (currentData.length > numPoints) {
      //console.log("Limit reached, dropping first record!");
      currentData.shift();
    }
    if (currentData !== undefined) {
      return currentData.map((element, index) => {
        return { ...element, index: (numPoints - currentData.length + index) }
      });
    }
    return [];
  }

  function getAveraged(data) {
    return data.averaged[selectedPin];
  }
  function getFiltered(data) {
    return data.filtered[selectedPin];
  }
  function getTouchLimit(data) {
    return data.filtered[selectedPin] - touchThreshold[selectedPin];
  }
  function getReleaseLimit(data) {
    if (config.thresholdMode === "STANDARD"){
    return data.filtered[selectedPin] + releaseThreshold[selectedPin];
    }else if (config.thresholdMode === "CROSS"){
      return data.release[selectedPin];
    }
  }
  function getTouchState(data) {
    return (data.keyState[selectedPin] ? 1 : 0);
  }
  function togglePause(e) {
    setPauseChart(!pauseChart);
  }

  return (
    <div>

      <form>
        <div className='section'>

          <button type="submit" id="set" onClick={setThresholds}>SET</button>
          <button type="submit" id="start" onClick={toggleStart}>{(start ? "STOP" : "START")}</button>
          <select id="pin" name="pin" onChange={changePin} value={selectedPin}>
            {Array.from({ length: nrKeys }).map((it, index) => <option key={index} value={index}>Pin {index}</option>)}
          </select>
        </div>
        {start > 0 &&
          <div>
            <div className='section'>
              <ComposedChart
                width={1024}
                height={500}
                data={pausedPlotData}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
                onClick={togglePause}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index"
                  domain={[0, numPoints]}
                  type="number" min={0} max={numPoints} />
                {/* <YAxis/> domain={[minVal, maxVal]} /> */}
                <YAxis domain={['dataMin-10', 'dataMax+10']} type="number" allowDataOverflow={true} />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Line
                  type="monotone"
                  dataKey={getAveraged}
                  name="average"
                  stroke="#FF0000"
                  dot={false}
                  activeDot={{ r: 5 }}
                  strokeWidth="2"
                />
{/*                 <Line
                  type="monotone"
                  dataKey={getFiltered}
                  stroke="#00FF00"
                  dot={false}
                  activeDot={{ r: 5 }}
                  strokeWidth="2"
                /> */}
                <Line
                  type="monotone"
                  dataKey={getTouchLimit}
                  stroke="#E87719"
                  name="touch threshold"
                  dot={false}
                  strokeWidth="2"
                />
                <Line
                  type="monotone"
                  dataKey={getReleaseLimit}
                  name="release threshold"
                  stroke="#19E5E8"
                  dot={false}

                  strokeWidth="2"
                />
                <YAxis domain={[0, 2]} yAxisId='touch' orientation='right' type="number" />
                <Area
                  type="monotone"
                  dataKey={getTouchState}
                  name="touch"
                  stroke="#0000FF"
                  strokeWidth="1"
                  dot={false}
                  yAxisId='touch'
                  fillOpacity="0.3"
                />
                {/* <Line
                  type="monotone"
                  dataKey={"avgTouched_" + selectedPin}
                  stroke="#00FFFF"
                  strokeWidth="1"
                  yAxisId='touch'
                /> */}
              </ComposedChart>
            </div>
          </div>}
        {touchThreshold !== undefined && touchThreshold.length > 0 && <div>
          <div className='section'>
            <label>Thresholds</label>
          </div>
          <div className='section'>
            <div className='labelCell'>
              <label>Touch</label>
            </div>
            <div className="thresholds">
              <div>
            <label>All</label>
              <InputNumber id={"touch_all"} key={"t_all_" + touchAll} inputValue={touchAll} steps={1} cycle={true} max={50} onChange={onChange} />
              </div>
              <div style={{ padding: "10px", marginLeft: "-20px", alignContent:"end" }}>        <button type="submit" id="fill" onClick={fillTouchThresholds}>FILL</button></div>
              {Array.from({ length: nrKeys }, (_, index) => {
                return <div>              <label style={{ marginLeft: "10px" }}>{index}</label>
                  <InputNumber id={"touch_" + index} key={"t_" + index + "_" + touchThreshold[index]} inputValue={touchThreshold[index]} steps={1} max={50} cycle={true} onChange={onChange} /></div>
              }
              )
              }
            </div>
          </div>
          <div className='section'>
            <div className='labelCell'>
              <label>Release</label>
            </div>
            <div className="thresholds">
              <InputNumber id={"release_all"} key={"r_all_" + releaseAll} inputValue={releaseAll} steps={1} cycle={true} min={-50} max={50} onChange={onChange} />
              <div style={{ padding: "10px", marginLeft: "-20px" }}>        <button type="submit" id="fill" onClick={fillReleaseThresholds}>FILL</button></div>
              {Array.from({ length: nrKeys }, (_, index) => {
                return <InputNumber id={"release_" + index} key={"r_" + index + "_" + releaseThreshold[index]} inputValue={releaseThreshold[index]} steps={1} min={-50} max={50} cycle={true} onChange={onChange} />
              }
              )
              }
            </div>
          </div>
        </div>}

      </form >
    </div >
  );
}

export default React.memo(Thresholds);
