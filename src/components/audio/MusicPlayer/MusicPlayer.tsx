import React, { useEffect, useRef } from "react";
import equal from "fast-deep-equal";
import { bisectRight } from "d3-array";

import * as Tone from "tone";
import { usePrevious } from "../../../hooks/usePrevious";

export const MusicPlayerContext = React.createContext<any>({
  playbackState: "stopped",
});

export const MusicPlayer: React.FC<any> = ({
  playbackState = "stopped",
  tempos = [],
  timeSignatures = [],
  // subdivision = '4n',
  swing = 0,
  swingSubdivision = "8n",
  volume = 0,
  isMuted = false,
  children,
}) => {
  const tempoPart = useRef<any>();
  const timeSignaturePart = useRef<any>();

  const prevTempos = usePrevious<any[]>(tempos);
  const prevTimeSignatures = usePrevious<any[]>(timeSignatures);

  useEffect(() => {
    if (playbackState === "started") {
      tempoPart.current = new Tone.Part((_, tempo) => {
        Tone.Transport.bpm.value = tempo.bpm;
      }, tempos);

      timeSignaturePart.current = new Tone.Part((_, timeSignature) => {
        Tone.Transport.timeSignature = timeSignature.timeSignature;
      }, timeSignatures);

      tempoPart.current?.start(0);
      timeSignaturePart.current?.start(0);
      Tone.Transport.start();
    } else if (playbackState === "paused") {
      Tone.Transport.pause();
    } else {
      Tone.Transport.stop();
      if (tempoPart.current) {
        tempoPart.current.stop();
      }
      if (timeSignaturePart.current) {
        timeSignaturePart.current.stop();
      }
    }
    /* eslint-disable-next-line */
  }, [playbackState]);

  useEffect(() => {
    if (tempoPart.current) {
      if (prevTempos?.length === tempos.length) {
        tempos.forEach((tempo: any, i: any) => {
          const isEqual = equal(tempos[i], prevTempos ? prevTempos[i] : []);

          if (!isEqual) {
            tempoPart.current?.remove(i);
            tempoPart.current?.add(i, tempo);
          }
        });
      } else {
        tempoPart.current.removeAll();
        tempos.forEach((tempo: any, i: any) => {
          tempoPart.current.add(i, tempo);
        });
      }

      // The current tempo may not be changed
      // because the tempo is not reflected until the scheduled time.
      // Therefore, the current tempo is changed here.
      const i = bisectRight(
        tempos.map((tempo: any) => parseInt(tempo.time.slice(0, -1))),
        Tone.Transport.ticks
      );
      Tone.Transport.bpm.value = tempos[i > 0 ? i - 1 : 0].bpm;
    }
    /* eslint-disable-next-line */
  }, [JSON.stringify(tempos)]);

  useEffect(() => {
    if (timeSignaturePart.current) {
      if (prevTimeSignatures?.length === timeSignatures.length) {
        timeSignatures.forEach((timeSignature: any, i: any) => {
          const isEqual = equal(
            timeSignatures[i],
            prevTimeSignatures ? prevTimeSignatures[i] : []
          );

          if (!isEqual) {
            timeSignaturePart.current?.remove(i);
            timeSignaturePart.current?.add(i, timeSignature);
          }
        });
      } else {
        timeSignaturePart.current.removeAll();
        timeSignatures.forEach((timeSignature: any, i: any) => {
          timeSignaturePart.current.add(i, timeSignature);
        });
      }
      // The current time signature may not be changed
      // because the time signature is not reflected until the scheduled time.
      // Therefore, the current time signature is changed here.
      const i = bisectRight(
        timeSignatures.map((timeSignature: any) =>
          parseInt(timeSignature.time.slice(0, -1))
        ),
        Tone.Transport.ticks
      );
      Tone.Transport.timeSignature =
        timeSignatures[i > 0 ? i - 1 : 0].timeSignature;
    }
    /* eslint-disable-next-line */
  }, [JSON.stringify(timeSignatures)]);

  useEffect(() => {
    Tone.Destination.volume.value = volume;
  }, [volume]);

  useEffect(() => {
    Tone.Destination.mute = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return function cleanup() {
      if (tempoPart.current) {
        tempoPart.current.dispose();
      }
      if (timeSignaturePart.current) {
        timeSignaturePart.current.dispose();
      }
    };
  }, []);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        playbackState,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};
