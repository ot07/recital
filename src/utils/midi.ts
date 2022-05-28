/**
 * Convert a MIDI note into a pitch.
 */
export function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return midiToPitchClass(midi) + octave.toString();
}

/**
 * Convert a MIDI note to a pitch class (just the pitch no octave).
 */
export function midiToPitchClass(midi: number): string {
  // prettier-ignore
  const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const note = midi % 12;
  return scaleIndexToNote[note];
}

/**
 * Convert a pitch class to a MIDI note.
 */
export function pitchClassToMidi(pitch: string): number {
  // prettier-ignore
  const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return scaleIndexToNote.indexOf(pitch);
}

/**
 * Convert a pitch to a MIDI number.
 */
// tslint:disable-next-line: only-arrow-functions typedef
export const pitchToMidi: (note: string) => number = (function () {
  const regexp = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;
  // prettier-ignore
  const noteToScaleIndex: any = {
    // tslint:disable-next-line: object-literal-sort-keys
    cbb: -2, cb: -1, c: 0, "c#": 1, cx: 2,
    dbb: 0, db: 1, d: 2, "d#": 3, dx: 4,
    ebb: 2, eb: 3, e: 4, "e#": 5, ex: 6,
    fbb: 3, fb: 4, f: 5, "f#": 6, fx: 7,
    gbb: 5, gb: 6, g: 7, "g#": 8, gx: 9,
    abb: 7, ab: 8, a: 9, "a#": 10, ax: 11,
    bbb: 9, bb: 10, b: 11, "b#": 12, bx: 13,
  };

  return (note: any) => {
    const split: any = regexp.exec(note);
    const pitch = split[1];
    const octave = split[2];
    const index = noteToScaleIndex[pitch.toLowerCase()];
    return index + (parseInt(octave, 10) + 1) * 12;
  };
})();
