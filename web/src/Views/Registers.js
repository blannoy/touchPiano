import { useState, useContext, useEffect, useRef } from 'react';
import ReactSlider from 'react-slider';
import { configContext, queryProviderContext } from "../Context/Context";
import { nrKeys } from '../Containers/Root';

import {
  ComposedChart,
  Area,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
} from "recharts";

function Registers() {
  const [config, setConfig] = useContext(configContext);
  const [requestState, dispatchRequest] = useContext(queryProviderContext);
  const [start, setStart] = useState(false);

  const [CDC, setCDC] = useState(1);
  const [CDT, setCDT] = useState(1);
  const [FFI, setFFI] = useState(1);
  const [SFI, setSFI] = useState(1);
  const [touchThreshold, setTouchThreshold] = useState(1);
  const [touchDebounce, setTouchDebounce] = useState(0);
  const [releaseThreshold, setReleaseThreshold] = useState(1);
  const [releaseDebounce, setReleaseDebounce] = useState(0);
  // MHD max half delta 1-63, NHD noise half delta 1-63, NCL noise count limit 0-255, FDL filter delay limit 0-255, rising/falling
  const [MHD, setMHD] = useState([1, 1]);
  const [NHD, setNHD] = useState([1, 1]);
  const [NCL, setNCL] = useState([0, 0]);
  const [FDL, setFDL] = useState([0, 0]);
  const [plotData, setPlotData] = useState([]);
  const [selectedPin, setSelectedPin] = useState(0);
  const data = useRef([]);
  const eventSource = useRef(undefined);
  const numPoints = 256;
  const [pauseChart,setPauseChart]=useState(false);
  const [pausedPlotData, setPausedPlotData] = useState([]);
  useEffect(() => {
    if (!pauseChart){
      setPausedPlotData(plotData);
    }
  }, [plotData]);
  useEffect(() => {
    if (config !== undefined && config !== null) {
      setCDC(config.CDC);
      setCDT(config.CDT);
      setStart((config.start));
      setFFI(config.FFI);
      setSFI(config.SFI);
      setTouchThreshold(config.touchThreshold);
      setTouchDebounce(config.touchDebounce);
      setReleaseThreshold(config.releaseThreshold);
      setReleaseDebounce(config.releaseDebounce);
      setMHD([config.Rising.MHD, config.Falling.MHD]);
      setNHD([config.Rising.NHD, config.Falling.NHD]);
      setNCL([config.Rising.NCL, config.Falling.NCL]);
      setFDL([config.Rising.FDL, config.Falling.FDL]);
    }
  }, [config]);

  function changePin(e) {
    setSelectedPin(e.target.value);
  }
  function changeMHDR(val) {
    setMHD([val, MHD[1]]);
  }
  function changeNHDR(val) {
    setNHD([val, NHD[1]]);
  }
  function changeNCLR(val) {
    setNCL([val, NCL[1]]);
  }
  function changeFDLR(val) {
    setFDL([val, FDL[1]]);
  }
  function changeMHDF(val) {
    setMHD([MHD[0], val]);
  }
  function changeNHDF(val) {
    setNHD([NHD[0], val]);
  }
  function changeNCLF(val) {
    setNCL([NCL[0], val]);
  }
  function changeFDLF(val) {
    setFDL([FDL[0], val]);
  }

  function doSubmit(e) {
    e.preventDefault();
    let params = {
      ...config,
      CDT: CDT,
      CDC: CDC,
      FFI: FFI,
      SFI: SFI,
      touchThreshold: touchThreshold,
      touchDebounce: touchDebounce,
      releaseThreshold: releaseThreshold,
      releaseDebounce: releaseDebounce,
      Rising: {
        MHD: MHD[0],
        NHD: NHD[0],
        NCL: NCL[0],
        FDL: FDL[0]
      },
      Falling: {
        MHD: MHD[1],
        NHD: NHD[1],
        NCL: NCL[1],
        FDL: FDL[1]
      }
    };
    if (!start) {

      eventSource.current = new EventSource(process.env.REACT_APP_BASE_URL + "/readings");
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
      if (JSON.stringify(config) !== JSON.stringify(params)){
        dispatchRequest({ type: 'SETCONFIG', method: 'post', body: { ...params }, params: {'start': !start } });
      }  else {
         dispatchRequest({ type: 'MODE', params: { 'mode': 'calibrate', 'start': !start } });
      }
    } else {
      eventSource.current.close();
      dispatchRequest({ type: 'MODE', params: { 'mode': 'calibrate', 'start': !start } });
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

  function getBaseline(data) {
    return data.baseline[selectedPin];
  }
  function getFiltered(data) {
    return data.filtered[selectedPin];
  }
  function getTouchState(data) {
    return data.keyState[selectedPin];
  }
  function togglePause(e){
    setPauseChart(!pauseChart);
   }
   function pushConfig(e){
    let params = {
      ...config,
      CDT: CDT,
      CDC: CDC,
      FFI: FFI,
      SFI: SFI,
      touchThreshold: touchThreshold,
      touchDebounce: touchDebounce,
      releaseThreshold: releaseThreshold,
      releaseDebounce: releaseDebounce,
      Rising: {
        MHD: MHD[0],
        NHD: NHD[0],
        NCL: NCL[0],
        FDL: FDL[0]
      },
      Falling: {
        MHD: MHD[1],
        NHD: NHD[1],
        NCL: NCL[1],
        FDL: FDL[1]
      }
    };
    dispatchRequest({ type: 'SETCONFIG', method: 'post', body: { ...params }});
   }

  return (
    <div>
      <form>
        <div className='section'>
          <input type="hidden" id="start" value="true" />
          <button type="submit" id="start" onClick={pushConfig}>SET</button>
          <button type="submit" id="start" onClick={doSubmit}>{(start ? "STOP" : "START")}</button>
          <select id="pin" name="pin" onChange={changePin} value={selectedPin}>
            {Array.from({ length: nrKeys}).map((it, index) => <option key={index} value={index}>Pin {index}</option>)}
          </select>
        </div>
        {start > 0 &&
          <div>
            <div className='section'>
              <ComposedChart
                width={1024}
                height={500}
                data={pausedPlotData}
                onClick={togglePause}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index"
                  domain={[0, numPoints]}
                  type="number" min={0} max={numPoints} />
                {/* <YAxis/> domain={[minVal, maxVal]} /> */}
                <YAxis domain={['dataMin-10', 'dataMax+10']} type="number" allowDataOverflow={true} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={getBaseline}
                  stroke="#FF0000"
                  activeDot={{ r: 5 }}
                  strokeWidth="2"
                  name="baseline"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={getFiltered}
                  stroke="#00FF00"
                  activeDot={{ r: 5 }}
                  strokeWidth="2"
                  name="filtered"
                  dot={false}
                />
                <YAxis domain={[0, 2]} yAxisId='touch' orientation='right' type="number" />
                <Area
                  type="monotone"
                  dataKey={getTouchState}
                  stroke="#0000FF"
                  strokeWidth="1"
                  yAxisId='touch'
                  name="touch"
                  dot={false}
                  fillOpacity={0.3}
                />
              </ComposedChart>
            </div>
          </div>}
        <div className='section'>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>FFI</label>
              <p>First filter samples (6,10,18,34)</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={FFI}
                min={0}
                max={3}
                onChange={setFFI}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>SFI</label>
              <p>Second filter samples (4, 6, 10, 18)</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={SFI}
                min={0}
                max={3}
                onChange={setSFI}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
        </div>
        <div className='section'>

          <div className='halfsection'>
            <div className='labelCell'>
              <label>CDC</label>
              <p>Charge Discharge Current (1-63)</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={CDC}
                min={0}
                max={63}
                onChange={setCDC}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>

          <div className='halfsection'>
            <div className='labelCell'>
              <label>CDT</label>
              <p>Charge Discharge Time (1-7)</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={CDT}
                onChange={setCDT}
                min={1}
                max={7}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
        </div>
        <div className='section'>
          <div className='labelCell'>
            <label>Touch threshold</label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={touchThreshold}
              min={0}
              max={255}
              onChange={setTouchThreshold}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>

        <div className='section'>
          <div className='labelCell'>
            <label>Release threshold</label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={releaseThreshold}
              min={0}
              max={255}
              onChange={setReleaseThreshold}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>
        <div className='section'>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>Touch debounce</label>
              <p>0-7</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={touchDebounce}
                min={0}
                max={7}
                onChange={setTouchDebounce}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>Release Debounce</label>
              <p>0-7</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={releaseDebounce}
                min={0}
                max={7}
                onChange={setReleaseDebounce}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
        </div>
        <div className='section'>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>Rising Max half delta MHD</label>
              <p>1-63</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={MHD[0]}
                min={1}
                max={63}
                onChange={changeMHDR}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>          <div className='halfsection'>
            <div className='labelCell'>
              <label>Rising Noise half delta</label>
              <p>1-63</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={NHD[0]}
                min={1}
                max={63}
                onChange={changeNHDR}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
        </div>
        <div className='section'>
          <div className='labelCell'>
            <label>Rising Noise Count Limit </label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={NCL[0]}
              min={0}
              max={255}
              onChange={changeNCLR}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>
        <div className='section'>
          <div className='labelCell'>
            <label>Rising Filter Delay Limit </label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={FDL[0]}
              min={0}
              max={255}
              onChange={changeFDLR}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>
        <div className='section'>
          <div className='halfsection'>
            <div className='labelCell'>
              <label>Falling Max half delta MHD</label>
              <p>1-63</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={MHD[1]}
                min={1}
                max={63}
                onChange={changeMHDF}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>          <div className='halfsection'>
            <div className='labelCell'>
              <label>Falling Noise half delta</label>
              <p>1-63</p>
            </div>
            <div className='bodyCell'>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="single-htrack"
                value={NHD[1]}
                min={1}
                max={63}
                onChange={changeNHDF}
                disabled={start}
                marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
              />
            </div>
          </div>
        </div>
        <div className='section'>
          <div className='labelCell'>
            <label>Falling Noise Count Limit </label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={NCL[1]}
              min={0}
              max={255}
              onChange={changeNCLF}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>
        <div className='section'>
          <div className='labelCell'>
            <label>Falling Filter Delay Limit </label>
            <p>0-255</p>
          </div>
          <div className='bodyCell'>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="thumb"
              trackClassName="single-htrack"
              value={FDL[1]}
              min={0}
              max={255}
              onChange={changeFDLF}
              disabled={start}
              marks markClassName="mark" renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default Registers;
