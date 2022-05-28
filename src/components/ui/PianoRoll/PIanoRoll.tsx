import React, { useCallback, useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Stage, Container, Graphics } from "@inlet/react-pixi";
import colors from "tailwindcss/colors";
import * as Tone from "tone";

const useRequestAnimationFrame = (
  isRunning: boolean,
  callback: (...args: any[]) => any
) => {
  const reqIdRef = useRef<any>();
  const loop = useCallback(() => {
    if (isRunning) {
      reqIdRef.current = requestAnimationFrame(loop);
      callback();
    }
  }, [isRunning, callback]);

  React.useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [loop]);
};

export const Note: React.FC<any> = ({
  index,
  ticks,
  durationTicks,
  midiNoteNumber,
  currentTicks,
}) => {
  const draw = (g: any) => {
    g.clear();
    if (
      ticks * 2 <= currentTicks &&
      (ticks + durationTicks) * 2 > currentTicks
    ) {
      g.beginFill(PIXI.utils.string2hex(colors.red[500]), 1);
    } else {
      g.beginFill(PIXI.utils.string2hex(colors.cyan[500]), 1);
    }
    g.drawRect(
      (ticks * 32) / 96,
      16 * (127 - midiNoteNumber),
      Math.max((durationTicks * 32) / 96 - 2, 1),
      16
    );
    g.endFill();
  };

  return <Graphics draw={draw} />;
};

export const MemorizedNote = React.memo(Note);

export const Notes: React.FC<any> = ({ notes, ticks }) => {
  return (
    <>
      {notes.map((note: any, index: any) => (
        <MemorizedNote
          key={index}
          index={index}
          ticks={note.ticks}
          durationTicks={note.durationTicks}
          midiNoteNumber={note.midi}
          currentTicks={ticks}
        />
      ))}
    </>
  );
};

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

  const [ticks, setTicks] = useState(0);

  const updateTicks = useCallback(() => {
    setTicks(Tone.Transport.ticks);
  }, []);
  useRequestAnimationFrame(true, updateTicks);

  // console.log("Tone.Transport.ticks:", Tone.Transport.ticks);
  // useRequestAnimationFrame((progress, next) => {
  //   setTicks(Tone.Transport.ticks);
  //   next();
  // });

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
      for (const note of notes) {
        if (
          Tone.Transport.state === "started" &&
          note.ticks * 2 <= ticks &&
          (note.ticks + note.durationTicks) * 2 > ticks
        ) {
          g.beginFill(PIXI.utils.string2hex(colors.red[500]), 1);
        } else {
          g.beginFill(PIXI.utils.string2hex(colors.cyan[500]), 1);
        }
        g.drawRect(
          (note.ticks * 32) / 96,
          16 * (127 - note.midi),
          Math.max((note.durationTicks * 32) / 96 - 2, 1),
          16
        );
      }
      g.endFill();
    },
    [notes, ticks]
  );

  // const NotesComponent = <Notes notes={notes} ticks={ticks} />;

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

  const drawPlayheadLine = React.useCallback(
    (g: any) => {
      g.clear();
      g.lineStyle(1, 0xffffff, 1);
      g.moveTo(Math.round((ticks * 32) / 96 / 2) - 2, 0);
      g.lineTo(Math.round((ticks * 32) / 96 / 2) - 2, height);
    },
    [ticks]
  );

  return (
    <div>
      <div>{`Ticks: ${ticks}`}</div>
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
          <Notes notes={notes} />
          <Graphics draw={drawPlayheadLine} />
        </Container>
      </Stage>
    </div>
  );
};
