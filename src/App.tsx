import { Transport, Track, Instrument } from "./components/audio/MusicPlayer";
import { Midi } from "@tonejs/midi";
import { useEffect, useState } from "react";
import * as Tone from "tone";

import "./App.css";
import { PianoRoll } from "./components/ui/PianoRoll/PianoRoll";

const MIDI_FILE = "230_bpm_multitrack.mid";

function App() {
  const [playbackState, setPlaybackState] = useState<any>("stopped");
  const [notes, setNotes] = useState<any>([]);
  const [tempos, setTempos] = useState<any>([]);
  const [timeSignatures, setTimeSignatures] = useState<any>([]);

  useEffect(() => {
    const readMidiFile = async () => {
      const midi = await Midi.fromUrl(MIDI_FILE);
      setNotes(
        midi.tracks[2].notes.map((note: any) => {
          return {
            pitch: note.name,
            durationTicks: Math.round(
              (note.durationTicks * Tone.Transport.PPQ) / midi.header.ppq
            ),
            ticks: Math.round(
              (note.ticks * Tone.Transport.PPQ) / midi.header.ppq
            ),
            velocity: note.velocity,
          };
        })
      );

      setTempos(
        midi.header.tempos.map((tempo: any) => {
          return {
            bpm: Math.round(tempo.bpm),
            ticks: Math.round(
              (tempo.ticks * Tone.Transport.PPQ) / midi.header.ppq
            ),
          };
        })
      );

      setTimeSignatures(
        midi.header.timeSignatures.map((timeSignature: any) => {
          return {
            timeSignature: timeSignature.timeSignature,
            ticks: Math.round(
              (timeSignature.ticks * Tone.Transport.PPQ) / midi.header.ppq
            ),
          };
        })
      );
    };
    readMidiFile();
  }, []);

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
      <PianoRoll
        playbackState={playbackState}
        notes={notes}
        tempos={tempos}
        timeSignature={timeSignatures}
      />
    </div>
  );
}

export default App;
