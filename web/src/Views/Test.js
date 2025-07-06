
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  Cell
} from "recharts";
import React from "react";
import { useState } from "react";

export default function Test() {
    const [selectedPin, setSelectedPin] = useState(0);
  const customTouchThreshold = [
    25, 30, 22, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25,
    25, 25, 25, 25, 25,
  ];
  const inputData = {
    keyState: [
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ],
    keyHit: [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
    filtered: [
      1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    ],
    averaged: [
      1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034,
    ],
    baseline: [],
    release: [900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900],
    clock: 79304,
  };

  function transformData(dataToTranform) {
    const result = Array.from({ length: 12 }, (_, i) => ({
      name: i,
      keystate: inputData.keyState[i],
      averaged: inputData.averaged[i] + (Math.floor(Math.random() * 20) - 5),
      filtered: inputData.filtered[i] + (Math.floor(Math.random() * 20) - 5),
      threshold : (inputData.keyState[i] ?  inputData.release[i]:inputData.averaged[i] - customTouchThreshold[i] ),
      touchThreshold: inputData.averaged[i] - customTouchThreshold[i],
      releaseThreshold: inputData.release[i],
    }));
    console.log(result);
    return result;
  }

  // const [dataToPlot, setDataToPlot] = React.useState(transformData(inputData));

  // React.useEffect(() => {
  //   const interval = setInterval(() => {
  //     setDataToPlot(transformData(inputData));
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);
  const dataToPlot = transformData(inputData);
  const minY = 900;
  const maxY = 1200;
  const dotWidth = 60;
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <div className="section">
        <label htmlFor="pin">Selected Pin:</label>
        {selectedPin}
      </div>
      <ComposedChart
        width={1024}
        height={500}
        data={dataToPlot}
        barGap={-50}

        margin={{
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
        }}

      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="threshold"  barSize={60}  fill="#CCCCCC" />
        
        <Bar
          dataKey="filtered"
          fill="#ffcccc"
          stroke="#FF0000"
          barSize={40}
          onClick={(e) => {
            setSelectedPin(e.name);
          }}
        >                                {
            dataToPlot.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(entry.keystate ? "#FFCCCC" : "#00CCCC")} />
            ))
          }</Bar>
      
      </ComposedChart>
             


    </div>
  );
}
