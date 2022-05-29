import React, { useCallback, useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Stage, Container, Graphics } from "@inlet/react-pixi";
import colors from "tailwindcss/colors";
import * as Tone from "tone";
import { Transport, Track, Instrument } from "../../audio/MusicPlayer";
import { pitchToMidi } from "../../../utils/midi";

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
  ticks,
  durationTicks,
  pitch,
  currentTicks,
}) => {
  const draw = (g: any) => {
    g.clear();
    if (ticks <= currentTicks && ticks + durationTicks > currentTicks) {
      g.beginFill(PIXI.utils.string2hex(colors.red[500]), 1);
    } else {
      g.beginFill(PIXI.utils.string2hex(colors.cyan[500]), 1);
    }
    g.drawRect(
      (ticks * 32) / 96,
      16 * (127 - pitchToMidi(pitch)),
      Math.max((durationTicks * 32) / 96 - 2, 1),
      16
    );
    g.endFill();
  };

  return <Graphics draw={draw} />;
};

export const MemorizedNote = React.memo(Note);

export const Notes: React.FC<any> = ({ notes, currentTicks }) => {
  return (
    <>
      {notes.map((note: any, index: any) => (
        <MemorizedNote
          key={index}
          index={index}
          ticks={note.ticks}
          durationTicks={note.durationTicks}
          pitch={note.pitch}
          currentTicks={currentTicks}
        />
      ))}
    </>
  );
};

export const PianoRollBackground: React.FC<any> = ({ width, height }) => {
  const draw = (g: any) => {
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
  };

  return <Graphics draw={draw} />;
};

export const MemorizedPianoRollBackground = React.memo(PianoRollBackground);

export const PianoRoll: React.FC<any> = (props) => {
  const [notes, setNotes] = useState(props.notes);
  const [tempos, setTempos] = useState(props.tempos);
  const [timeSignatures, setTimeSignatures] = useState(props.timeSignatures);

  useEffect(() => {
    setNotes(props.notes);
  }, [props.notes]);

  useEffect(() => {
    setTempos(props.tempos);
  }, [props.tempos]);

  useEffect(() => {
    setTimeSignatures(props.timeSignatures);
  }, [props.timeSignatures]);

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

  useEffect(() => {
    const playheadX = (ticks * 32) / 96;
    const rightEdgeOfStage = -scroll.x + 960;
    if (playheadX - rightEdgeOfStage > 0 && playheadX - rightEdgeOfStage < 8) {
      setScroll({ ...scroll, x: scroll.x - 960 });
    }
  }, [ticks, width]);

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

  const drawPlayheadLine = React.useCallback(
    (g: any) => {
      g.clear();
      g.lineStyle(1, 0xffffff, 1);
      g.moveTo(Math.round((ticks * 32) / 96) - 2, 0);
      g.lineTo(Math.round((ticks * 32) / 96) - 2, height);
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
          <MemorizedPianoRollBackground width={width} height={height} />
          <Notes notes={notes} />
          <Graphics draw={drawPlayheadLine} />
        </Container>
      </Stage>

      <Transport
        tempos={tempos}
        timeSignatures={timeSignatures}
        playbackState={props.playbackState}
        volume={-18}
      >
        <Track
          notes={notes}
          volume={0}
          pan={0}
          // Callback for every tick
          onStepPlay={(time: any, note: any) => {
            console.log(
              "time:",
              time,
              ", tempo:",
              Tone.Transport.bpm.value,
              ", timeSignature:",
              Tone.Transport.timeSignature,
              ", note:",
              note
            );
          }}
        >
          <Instrument
            type="synth"
            oscillator={{ type: "square" }}
            envelope={{
              attack: 0.01,
              decay: 0.1,
              sustain: 0.5,
              release: 0.01,
            }}
            polyphony={32}
          />
          {/* Add effects chain here */}
          {/* <Effect type="feedbackDelay" /> */}
          {/* <Effect type="distortion" /> */}
        </Track>
      </Transport>
    </div>
  );
};
