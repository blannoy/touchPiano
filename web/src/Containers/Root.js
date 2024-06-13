import React, { useState, useEffect, useReducer } from "react";
import Main from "./Main";
import { configContext, queryProviderContext } from "../Context/Context";
import useRequest, { requestReducer, defaultRequest } from "../Context/Reducer";
import { RotatingLines } from "react-loader-spinner";

export const nrKeys=24;

export default function Root() {
  const [initialConfig, setInitialConfig] = useState(null);
  const [error, setError] = useState({ currentUrl: "", object: {} });
  const [response, err, runRequest] = useRequest();
  const [requestState, dispatchRequest] = useReducer(requestReducer, defaultRequest)

  useEffect(() => {
    if (requestState.url !== "") {
      runRequest(requestState);
    }
  }, [requestState]);

  useEffect(() => {
    if (initialConfig === null && response === null) {
      dispatchRequest({ type: 'LOADCONFIG' });
    } else if (response !== null) {
      setInitialConfig(response.data);
      switch (response.config.url) {
        case "/config":
          dispatchRequest({ type: 'MODE', params: { 'mode': 'all', 'start': false } });
          break;
        case "/thresholds":
          break;
        case "/setReg":
          break;
        case "/pianoState":
          break;
        default:
          break;
      }
    }
    if (err) {
      setError({ currentUrl: window.location.href, object: { ...err } });
    }
  }, [response, err])

  return (
    <configContext.Provider value={[initialConfig, setInitialConfig]}>
      <queryProviderContext.Provider value={[requestState, dispatchRequest]}>
        <Main />
{/*         {(Object.keys(error.object).length > 0) &&
          <div>
            {(error.currentUrl === window.location.href) &&
              (<pre>
                {error.object.message}<br />
                {(error.object.response ? JSON.stringify(error.object.response.data) : "")}</pre>)}
          </div>
        } */}
      </queryProviderContext.Provider>
    </configContext.Provider>
  );
}
