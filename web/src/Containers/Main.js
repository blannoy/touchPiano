import React from "react";
import {
    Route,
    NavLink,
    HashRouter,
    Routes
  } from "react-router-dom";
import Home from "../Views/Home";
import Calibrate from "../Views/Calibrate";
import Thresholds from "../Views/Thresholds";
import Admin from "../Views/Admin";

export default function Main() {
  
    return (
        <HashRouter>
        <div>
          <h1>Piano</h1>
          <ul className="header">
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/Thresholds">Thresholds</NavLink></li>
            <li><NavLink to="/Calibrate">Calibrate</NavLink></li>
            <li><NavLink to="/Admin">Admin</NavLink></li>
          </ul>
          <div className="content">
            <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/Thresholds" element={<Thresholds/>}/>
            <Route path="/Calibrate" element={<Calibrate/>}/>
            <Route path="/Admin" element={<Admin/>}/>
            </Routes>
          </div>
        </div>
        </HashRouter>
    );
  }
