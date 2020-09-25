import React, { useState, useEffect } from "react";

interface Props {
  animateEnter?: boolean;
}

export default function FishyEmoji({ animateEnter }: Props) {
  return (
    <div className={`fishy-emoji ${animateEnter ? "with-open-anim" : ""}`}>
      <span role="img" aria-label="Fish">
        🐟
      </span>
    </div>
  );
}
