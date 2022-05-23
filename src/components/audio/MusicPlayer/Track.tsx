import React, { useState, useEffect, useRef } from "react";
import equal from "fast-deep-equal";

import { MusicPlayerContext } from "./MusicPlayer";
import * as Tone from "tone";
import { usePrevious } from "../../../hooks/usePrevious";

export const TrackContext = React.createContext<any>({
  volume: 0,
  pan: 0,
  mute: false,
  solo: false,
  effectsChain: null,
  onInstrumentsUpdate: null,
  onAddToEffectsChain: null,
  onRemoveFromEffectsChain: null,
});

const TrackConsumer: React.FC<any> = ({
  // <MusicPlayer /> props
  playbackState,
  // <Track /> props
  notes = [],
  volume = 0,
  pan = 0,
  mute,
  solo,
  subdivision = "4n",
  effects = [],
  children,
  onStepPlay,
}) => {
  const [effectsChain, setEffectsChain] = useState<any>([]);
  const [instruments, setInstruments] = useState<any>([]);
  const part = useRef<any>();
  const instrumentsRef = useRef<any[]>(instruments);

  useEffect(() => {
    instrumentsRef.current = instruments;
  }, [instruments]);

  const prevNotes = usePrevious<any>(notes);
  const prevPlaybackState = usePrevious<any>(playbackState);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // STEPS
    // -------------------------------------------------------------------------

    // Start/Stop track!
    if (playbackState === "started" && prevPlaybackState === "stopped") {
      part.current = new Tone.Part((time, note) => {
        instrumentsRef.current.forEach((instrument) => {
          instrument.triggerAttackRelease(
            note.name,
            note.duration,
            time,
            note.velocity
          );
        });
        if (typeof onStepPlay === "function") {
          onStepPlay(time, note);
        }
      }, notes);

      // Start a little slower to wait for tempo and time signature to change
      part.current?.start(0.01);
    } else if (playbackState === "stopped") {
      if (part.current) {
        part.current.stop();
      }
    }

    if (playbackState !== "started") {
      if (instrumentsRef.current) {
        instrumentsRef.current.forEach((instrument) => instrument.releaseAll());
      }
    }
    /* eslint-disable-next-line */
  }, [playbackState]);

  useEffect(() => {
    if (part.current) {
      if (prevNotes?.length === notes.length) {
        // When notes length is the same, update notes in a more efficient way
        notes.forEach((note: any, i: any) => {
          const isEqual = equal(notes[i], prevNotes ? prevNotes[i] : []);

          if (!isEqual) {
            part.current?.remove(i);
            part.current?.add(i, note);
          }
        });
      } else {
        // When new notes are less or more then prev, remove all and add new notes
        part.current.removeAll();
        notes.forEach((note: any, i: any) => {
          part.current.add(i, note);
        });
      }
    }
    /* eslint-disable-next-line */
  }, [JSON.stringify(notes)]);

  useEffect(() => {
    return function cleanup() {
      if (part.current) {
        part.current.dispose();
      }
    };
  }, []);

  const handleAddToEffectsChain = (effect: any) => {
    // console.log('<Track />', 'onAddToEffectsChain');

    setEffectsChain((prevEffectsChain: any) => {
      return [effect, ...prevEffectsChain];
    });
  };

  const handleRemoveFromEffectsChain = (effect: any) => {
    // console.log('<Track />', 'onRemoveFromEffectsChain', effect);

    setEffectsChain((prevEffectsChain: any) => {
      return prevEffectsChain.filter((e: any) => e.id !== effect.id);
    });
  };

  const handleInstrumentsUpdate = (newInstruments: any[]) => {
    setInstruments(newInstruments);
  };

  return (
    <TrackContext.Provider
      value={{
        effectsChain, // Used by Instrument
        pan,
        volume,
        mute,
        solo,
        onInstrumentsUpdate: handleInstrumentsUpdate,
        onAddToEffectsChain: handleAddToEffectsChain,
        onRemoveFromEffectsChain: handleRemoveFromEffectsChain,
      }}
    >
      {children}
      {effects}
    </TrackContext.Provider>
  );
};

export const Track: React.FC<any> = (props) => {
  const { playbackState } = React.useContext(MusicPlayerContext);

  if (typeof window === "undefined") {
    return null;
  }

  return <TrackConsumer playbackState={playbackState} {...props} />;
};
