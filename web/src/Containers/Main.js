import React from "react";
import {
    Route,
    NavLink,
    HashRouter,
    Routes
  } from "react-router-dom";
import Play from "../Views/Play";
import Registers from "../Views/Registers";
import Thresholds from "../Views/Thresholds";
import Admin from "../Views/Admin";

export default function Main() {
  
    return (
        <HashRouter>
        <div>
          <h1>Piano</h1>
          <ul className="header">
            <li><NavLink to="/">Play</NavLink></li>
            <li><NavLink to="/Thresholds">Thresholds</NavLink></li>
            <li><NavLink to="/Registers">Registers</NavLink></li>
            <li><NavLink to="/Admin">Admin</NavLink></li>
          </ul>
          <div className="content">
            <Routes>
            <Route path="/" element={<Play/>}/>
            <Route path="/Thresholds" element={<Thresholds/>}/>
            <Route path="/Registers" element={<Registers/>}/>
            <Route path="/Admin" element={<Admin/>}/>
            </Routes>
          </div>
        </div>
        </HashRouter>
    );
  }
