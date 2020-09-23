import React from "react";
import "./Header.css";

import comet from "../assets/comet.png";

export default function Header() {
  return (
    <div className="header">
      <div className="brand">
        <img src={comet} alt="Spacebank Logo" className="logo" />
        <div className="text">
          <div className="primary">SPACEBANK</div>
          <div className="secondary">Your finances. To the moon.™</div>
        </div>
      </div>
    </div>
  );
}
