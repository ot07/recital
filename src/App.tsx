import { MusicPlayer, Track, Instrument } from "./components/audio/MusicPlayer";
import { Midi } from "@tonejs/midi";
import { useEffect, useState } from "react";
import * as Tone from "tone";

import "./App.css";
import { PianoRoll } from "./components/ui/PianoRoll/PianoRoll";

const MIDI_FILE = "230_bpm_multitrack.mid";

function App() {
  const [playbackState, setPlaybackState] = useState<any>("stopped");
  const [midi, setMidi] = useState<any>();
  const [tempos, setTempos] = useState<any>([]);
  const [timeSignatures, setTimeSignatures] = useState<any>([]);

  useEffect(() => {
    const readMidiFile = async () => {
      const midi = await Midi.fromUrl(MIDI_FILE);
      setMidi(midi);
    };
    readMidiFile();
  }, []);

  useEffect(() => {
    if (midi) {
      setTempos(
        midi.header.tempos.map((tempo: any) => {
          return {
            bpm: Math.round(tempo.bpm),
            time: `${Math.round(
              (tempo.ticks * Tone.Transport.PPQ) / midi.header.ppq
            )}i`,
          };
        })
      );

      setTimeSignatures(
        midi.header.timeSignatures.map((timeSignature: any) => {
          return {
            timeSignature: timeSignature.timeSignature,
            time: `${Math.round(
              (timeSignature.ticks * Tone.Transport.PPQ) / midi.header.ppq
            )}i`,
          };
        })
      );
    }
  }, [midi]);

  return (
    <div className="App">
      <p>
        <button
          onClick={() =>
            setPlaybackState((state: any) =>
              state === "started" ? "paused" : "started"
            )
          }
        >
          {playbackState === "started" ? "pause" : "start"}
        </button>
        <button onClick={() => setPlaybackState("stopped")}>stop</button>
        <button
          onClick={() =>
            setTempos((prevTempos: any) =>
              prevTempos.map((tempo: any) => {
                return { ...tempo, bpm: 150 };
              })
            )
          }
        >
          change tempo to 150
        </button>
        <button
          onClick={() =>
            setTimeSignatures((prevTimeSignatures: any) =>
              prevTimeSignatures.map((timeSignature: any) => {
                return { ...timeSignature, timeSignature: [5, 4] };
              })
            )
          }
        >
          change time signature to 5/4
        </button>
      </p>
      <PianoRoll notes={midi ? midi.tracks[2].notes : []} />

      <MusicPlayer
        tempos={tempos}
        timeSignatures={timeSignatures}
        playbackState={playbackState}
        volume={-18}
      >
        {midi
          ? midi.tracks.map((track: any, i: any) => (
              <Track
                key={i}
                // Array of several types
                notes={track.notes.map((note: any) => {
                  return {
                    name: note.name,
                    duration: `${Math.round(
                      (note.durationTicks * Tone.Transport.PPQ) /
                        midi.header.ppq
                    )}i`,
                    time: `${Math.round(
                      (note.ticks * Tone.Transport.PPQ) / midi.header.ppq
                    )}i`,
                    velocity: note.velocity,
                  };
                })}
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
            ))
          : null}
      </MusicPlayer>
    </div>
  );
}

export default App;
