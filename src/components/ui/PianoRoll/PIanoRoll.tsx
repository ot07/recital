import React, { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { Stage, Container, Graphics } from "@inlet/react-pixi";
import colors from "tailwindcss/colors";

export const PianoRoll: React.FC<any> = ({ notes }) => {
  const [width, setWidth] = useState(0);
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const height = 128 * 16;
  const resolution = Math.min(window.devicePixelRatio, 2);
  const stageProps = {
    options: {
      autoDensity: true,
      resolution: resolution || 1,
      antialias: resolution <= 1,
    },
  };

  useEffect(() => {
    const endTicks = notes.reduce(
      (endTicks: number, note: any) =>
        Math.max(endTicks, note.ticks + note.durationTicks),
      0
    );
    setWidth((endTicks * 32) / 96);
  }, [notes]);

  const drawNotes = React.useCallback(
    (g: any) => {
      g.clear();
      g.beginFill(PIXI.utils.string2hex(colors.cyan[500]), 1);
      for (const note of notes) {
        g.drawRect(
          (note.ticks * 32) / 96,
          16 * (127 - note.midi),
          Math.max((note.durationTicks * 32) / 96 - 2, 1),
          16
        );
      }
      g.endFill();
    },
    [notes]
  );

  const drawBackground = React.useCallback(
    (g: any) => {
      g.clear();
      g.beginFill(0x272934);
      g.drawRect(0, 0, width, height);
      g.endFill();

      g.beginFill(0x1e2028);
      for (let i = 0; i < 128; i++) {
        if ([1, 3, 6, 8, 10].includes(i % 12)) {
          g.drawRect(0, 16 * (127 - i), width, 16);
        }
      }
      g.endFill();

      g.lineStyle(0.5, 0x5a5078);
      for (let i = 0; i < 128; i++) {
        if ([4, 11].includes(i % 12)) {
          g.moveTo(0, 16 * (127 - i) + 0.5);
          g.lineTo(width, 16 * (127 - i) + 0.5);
        }
      }
    },
    [width]
  );

  return (
    <div>
      <Stage
        width={960}
        height={640}
        {...stageProps}
        onWheel={(event) =>
          setScroll((scroll) => {
            return {
              x: Math.max(Math.min(scroll.x - event.deltaX, 0), -width + 960),
              y: Math.max(Math.min(scroll.y - event.deltaY, 0), -height + 640),
            };
          })
        }
      >
        <Container {...scroll}>
          <Graphics draw={drawBackground} />
          <Graphics draw={drawNotes} />
        </Container>
      </Stage>
    </div>
  );
};
