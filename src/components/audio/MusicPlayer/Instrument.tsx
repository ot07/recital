import React, { useEffect, useRef, useContext } from "react";

import { TrackContext } from "./Track";
import * as Tone from "tone";
import { usePrevious } from "../../../hooks/usePrevious";

const InstrumentConsumer: React.FC<any> = ({
  // <Instrument /> Props
  type = "synth",
  options,
  polyphony = 4,
  oscillator,
  envelope,
  notes = [],
  samples,
  onLoad,
  // <Track /> Props
  volume,
  pan,
  mute,
  solo,
  effectsChain,
  onInstrumentsUpdate,
}) => {
  const instrumentRef = useRef<any>();
  // const trackChannelBase = useRef(new Tone.PanVol(pan, volume));
  // const trackChannelBase = useRef(new Tone.Channel(volume, pan));
  const trackChannelBase = useRef<any>(null);
  const prevNotes = usePrevious<any>(notes);

  // -------------------------------------------------------------------------
  // CHANNEL
  // TODO: Consider moving this to <Track>
  // -------------------------------------------------------------------------

  useEffect(() => {
    trackChannelBase.current = new Tone.Channel(volume, pan);

    return function cleanup() {
      if (trackChannelBase.current) {
        trackChannelBase.current.dispose();
      }
    };
    /* eslint-disable-next-line */
  }, []);

  // -------------------------------------------------------------------------
  // INSTRUMENT TYPE
  // -------------------------------------------------------------------------

  const prevType = usePrevious(type);

  useEffect(() => {
    if (type === "sampler") {
      instrumentRef.current = new Tone.Sampler(samples, onLoad);

      if (options && options.curve) {
        instrumentRef.current.curve = options.curve;
      }

      if (options && options.release) {
        instrumentRef.current.release = options.release;
      }
    } else if (type === "membraneSynth") {
      instrumentRef.current = new Tone.MembraneSynth({
        oscillator,
        envelope,
      });
    } else if (type === "metalSynth") {
      instrumentRef.current = new Tone.MetalSynth();
    } else if (type === "noiseSynth") {
      instrumentRef.current = new Tone.NoiseSynth();
    } else if (type === "pluckSynth") {
      instrumentRef.current = new Tone.PluckSynth();
    } else {
      let synth;

      if (type === "amSynth") {
        synth = Tone.AMSynth;
      } else if (type === "duoSynth") {
        synth = Tone.DuoSynth;
      } else if (type === "fmSynth") {
        synth = Tone.FMSynth;
      } else if (type === "monoSynth") {
        synth = Tone.MonoSynth;
      } else if (type === "synth") {
        synth = Tone.Synth;
      } else {
        synth = Tone.Synth;
      }

      /**
       * PolySynth accepts other Synth types as second param, making them
       * polyphonic. As this is a common use case, all Synths will be created
       * via PolySynth. Monophonic synths can easily be created by setting the
       * `polyphony` prop to 1.
       */
      instrumentRef.current = new Tone.PolySynth({
        maxPolyphony: polyphony,
        options: {
          oscillator,
          envelope,
          polyphony,
        },
        voice: synth,
      } as any);
    }

    instrumentRef.current.chain(
      ...effectsChain,
      trackChannelBase.current,
      Tone.Destination
    );

    // Add this Instrument to Track Context
    onInstrumentsUpdate([instrumentRef.current]);

    return function cleanup() {
      if (instrumentRef.current) {
        instrumentRef.current.dispose();
      }
    };
    /* eslint-disable-next-line */
  }, [type, polyphony]);

  useEffect(() => {
    if (
      // TODO: Add other synth types
      type === "synth" &&
      instrumentRef &&
      instrumentRef.current &&
      oscillator
    ) {
      instrumentRef.current.set({ oscillator });
      // console.log(oscillator);
    }
  }, [oscillator, type]);

  // -------------------------------------------------------------------------
  // VOLUME / PAN / MUTE / SOLO
  // -------------------------------------------------------------------------

  useEffect(() => {
    trackChannelBase.current.volume.value = volume;
  }, [volume]);

  useEffect(() => {
    trackChannelBase.current.pan.value = pan;
  }, [pan]);

  useEffect(() => {
    trackChannelBase.current.mute = mute;
  }, [mute]);

  useEffect(() => {
    trackChannelBase.current.solo = solo;
  }, [solo]);

  // -------------------------------------------------------------------------
  // NOTES
  // -------------------------------------------------------------------------

  /**
   * NOTE: Would prefer to use useLayoutEffect as it is a little faster, but unable to test it right now
   **/
  useEffect(() => {
    // Loop through all current notes
    notes &&
      notes.forEach((note: any) => {
        // Check if note is playing
        const isPlaying =
          prevNotes &&
          prevNotes.filter((prevNote: any) => {
            // Check both note name and unique key.
            // Key helps differentiate same notes, otherwise it won't trigger
            return prevNote.name === note.name && prevNote.key === note.key;
          }).length > 0;

        // Only play note is it isn't already playing
        if (!isPlaying) {
          if (note.duration) {
            instrumentRef.current.triggerAttackRelease(
              note.name,
              note.duration,
              undefined,
              note.velocity
            );
          } else {
            instrumentRef.current.triggerAttack(
              note.name,
              undefined,
              note.velocity
            );
          }
        }
      });

    // Loop through all previous notes
    prevNotes &&
      prevNotes.forEach((note: any) => {
        // Check if note is still playing
        const isPlaying =
          notes && notes.filter((n: any) => n.name === note.name).length > 0;

        if (!isPlaying) {
          instrumentRef.current.triggerRelease(note.name);
        }
      });
  }, [notes, prevNotes]);

  // -------------------------------------------------------------------------
  // EFFECTS CHAIN
  // -------------------------------------------------------------------------

  useEffect(() => {
    // NOTE: Using trackChannelBase causes effects to not turn off
    instrumentRef.current.disconnect();
    instrumentRef.current.chain(
      ...effectsChain,
      trackChannelBase.current,
      Tone.Destination
    );
  }, [effectsChain]);

  // -------------------------------------------------------------------------
  // SAMPLES
  // Run whenever `samples` change, using Tone.Sampler's `add` method to load
  // more samples after initial mount
  // TODO: Check if first mount, as sampler constructor has already loaded samples
  // -------------------------------------------------------------------------

  const prevSamples = usePrevious(samples);

  useEffect(() => {
    // When sampler is initiated, it already loads samples.
    // We'll use !isFirstSamplerInit to skip adding samples if sampler has been
    // initiated in this render.
    const isFirstSamplerInit = type === "sampler" && prevType !== type;

    if (type === "sampler" && Boolean(samples) && !isFirstSamplerInit) {
      // const isEqual = equal(samples, prevSamples);
      const prevSampleKeys = Object.keys(prevSamples);
      const sampleKeys = Object.keys(samples);

      // Samples to add
      const addSampleKeys = sampleKeys.filter(
        (key) => !prevSampleKeys.includes(key)
      );

      // Samples to remove
      // const removeSampleKeys = prevSampleKeys.filter(
      //   (key) => !sampleKeys.includes(key),
      // );

      // console.log(addSampleKeys, removeSampleKeys);

      if (addSampleKeys.length) {
        // Create an array of promises from `samples`
        const loadSamplePromises = addSampleKeys.map((key) => {
          return new Promise((resolve) => {
            const sample = samples[key];
            const prevSample = prevSamples ? prevSamples[key] : "";

            // Only update sample if different than before
            if (sample !== prevSample) {
              // Pass `resolve` to `onLoad` parameter of Tone.Sampler
              // When sample loads, this promise will resolve
              instrumentRef.current.add(key, sample, resolve);
            } else {
              resolve(null);
            }
          });
        });

        // Once all promises in array resolve, run onLoad callback
        Promise.all(loadSamplePromises).then((event) => {
          if (typeof onLoad === "function") {
            onLoad(event);
          }
        });

        // TODO: Work out a way to remove samples. Below doesn't work
        // removeSampleKeys.forEach((key) => {
        //   instrumentRef.current.add(key, null);
        // });
      }
    }
    /* eslint-disable-next-line */
  }, [samples, type]);

  return null;
};

export const Instrument: React.FC<any> = ({
  type,
  options,
  notes,
  polyphony,
  oscillator,
  envelope,
  samples,
  onLoad,
}) => {
  const { volume, pan, mute, solo, effectsChain, onInstrumentsUpdate } =
    useContext(TrackContext);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <InstrumentConsumer
      // <Instrument /> Props
      type={type}
      options={options}
      notes={notes}
      polyphony={polyphony}
      oscillator={oscillator}
      envelope={envelope}
      samples={samples}
      onLoad={onLoad}
      // <Track /> Props
      volume={volume}
      pan={pan}
      mute={mute}
      solo={solo}
      effectsChain={effectsChain}
      onInstrumentsUpdate={onInstrumentsUpdate}
    />
  );
};
