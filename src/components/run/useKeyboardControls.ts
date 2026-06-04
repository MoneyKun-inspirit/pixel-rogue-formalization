import { useEffect, useState } from "react";
import type { ControlState } from "@/game/types";

const defaultState: ControlState = {
  up: false,
  down: false,
  left: false,
  right: false,
  cast: false,
};

const keyMap: Record<string, keyof ControlState> = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
  " ": "cast",
};

export function useKeyboardControls() {
  const [controls, setControls] = useState<ControlState>(defaultState);

  useEffect(() => {
    function updateKey(pressed: boolean, rawKey: string) {
      const key = keyMap[rawKey.toLowerCase()];
      if (!key) {
        return;
      }

      setControls((previous) => ({ ...previous, [key]: pressed }));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      updateKey(true, event.key === " " ? " " : event.key);
    }

    function handleKeyUp(event: KeyboardEvent) {
      updateKey(false, event.key === " " ? " " : event.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return controls;
}
