
import { useState, useEffect, useContext } from 'react';
import { configContext, queryProviderContext } from "../Context/Context";
import { useNavigate } from "react-router-dom";
import { RotatingLines } from "react-loader-spinner";
export default function Admin() {
  const [config, setConfig] = useContext(configContext);
  const [requestState, dispatchRequest] = useContext(queryProviderContext);
  const [wifiMode, setWifiMode] = useState("CLIENT");
  const [thresholdMode, setThreshMode] = useState("CROSS");
  const [apPW, setApPW] = useState(undefined);
  const navigate = useNavigate();
  const [waitReboot,setWaitReboot]=useState(false);
  const [autoReleaseTiming,setAutoReleaseTiming]=useState(60000);
  const [averagePeriod,setAveragePeriod]=useState(5);

  useEffect(() => {
    if (config !== null && config !== undefined) {
      setWifiMode(config.wifiMode);
      setAutoReleaseTiming(config.autoRelease);
      setAveragePeriod(config.averagePeriod);
      setThreshMode(config.thresholdMode);
    }
  }, [config])
  function goHome(){ 
    setTimeout(() => {
      setWaitReboot(false);
      navigate("/");
    }, 5000);
  };
  function setMode() {
    if (wifiMode === "AP"){
      if (apPW !== undefined && apPW!== "" && apPW!== null) {
      dispatchRequest({ type: 'WIFIMODE', params: { 'mode': wifiMode , "PW": apPW }});
      } else {
        alert("Set AP password!");
      }
    } else if (wifiMode === "CLIENT") {
      dispatchRequest({ type: 'WIFIMODE', params: { 'mode': wifiMode }});
    }

   setWaitReboot(true);

  goHome();

  }
  function setThresholdMode() {

      dispatchRequest({ type: 'THRESHOLDMODE', params: { 'mode': thresholdMode }});

  }

  function resetWifi() {
    dispatchRequest({ type: 'WIFIMODE', params: { 'mode': "RESET" } });
goHome();
  }
  function changeMode(e) {
    setWifiMode(e.target.value);
  }
  function setPassword(e){
    setApPW(e.target.value);
  }
  function changeThresholdMode(e) {
    setThreshMode(e.target.value);
  }
  function changeAutoRelease(e) {
    setAutoReleaseTiming(e.target.value);
  }

  function sendAutoRelease(e){
    dispatchRequest({ type: 'AUTORELEASE', params: { 'value': autoReleaseTiming} });
  }
  function changeAveragePeriod(e) {
    setAveragePeriod(e.target.value);
  }

  function sendAveragePeriod(e){
    dispatchRequest({ type: 'AVERAGEPERIOD', params: { 'value': averagePeriod} });
  }

  return (
    <div>
      <div className='section'>
        <select id="thresholdMode" name="mode" onChange={changeThresholdMode} value={thresholdMode}>
          <option key="standard" value="STANDARD">Standard thresholds below/above running average</option>
          <option key="cross" value="CROSS">Release threshold = crossing point touch - threshold</option>
        </select>

        <button type="submit" id="setthresholdmode" onClick={setThresholdMode}>Set threshold mode</button>
      </div>
      <div className='section'>
        <label>Autorelease key after (in ms)</label>
        <input type="number" min="0" max="60000" id="autoRelease" value={autoReleaseTiming} onChange={changeAutoRelease}></input>
        <button type="submit" id="setautorelease" onClick={sendAutoRelease}>Set autorelease timing</button>
      </div>
      <div className='section'>
        <label>Number values for moving average</label>
        <input type="number" min="1" max="20" id="averagePeriod" value={averagePeriod} onChange={changeAveragePeriod}></input>
        <button type="submit" id="setautorelease" onClick={sendAveragePeriod}>Set period</button>
      </div>
      <div className='section'>
        Device will reboot after change in wifi settings.
      </div>
      <div className='section'>
        <button type="submit" id="reset" onClick={resetWifi}>Reset wifi</button>
      </div><div className='section'>
        <select id="mode" name="mode" onChange={changeMode} value={wifiMode}>
          <option key="client" value="CLIENT">Wifi client</option>
          <option key="ap" value="AP">Access point</option>
        </select>

        <button type="submit" id="setmode" onClick={setMode}>Set wifi mode</button>
      </div>
      {((wifiMode === "AP" && (apPW === undefined || apPW === ""))) && <div>Set password for AP mode</div>}
      {wifiMode === "AP" && <input type="text" maxLength="30" id="APPW" name="AP password" onChange={setPassword}></input>}
      {(waitReboot? 
      <div>
                <RotatingLines
                strokeColor="grey"
                strokeWidth="5"
                animationDuration="0.75"
                width="96"
                visible={true}
              />
              </div> : "")
      }
    </div>
  );
};