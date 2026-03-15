import { registerInstrument } from "./manage";
import { SamplesInstrument } from "./samples-instrument";

const GM_INSTRUMENTS: { name: string, folder?: string }[] = [
    // Piano
    { name: "Acoustic Grand Piano", folder: "000-acoustic-grand-piano" },
    { name: "Bright Acoustic Piano", folder: "001-bright-acoustic-piano" },
    { name: "Electric Grand Piano", folder: "002-electric-grand-piano" },
    { name: "Honky-tonk Piano", folder: "003-honkytonk-piano" },
    { name: "Electric Piano 1", folder: "004-electric-piano-1" },
    { name: "Electric Piano 2", folder: "005-electric-piano-2" },
    { name: "Harpsichord", folder: "006-harpsichord" },
    { name: "Clavinet", folder: "007-clavinet" },
    // Chromatic Percussion
    { name: "Celesta", folder: "008-celesta" },
    { name: "Glockenspiel", folder: "009-glockenspiel" },
    { name: "Music Box", folder: "010-music-box" },
    { name: "Vibraphone", folder: "011-vibraphone" },
    { name: "Marimba", folder: "012-marimba" },
    { name: "Xylophone", folder: "013-xylophone" },
    { name: "Tubular Bells", folder: "014-tubular-bells" },
    { name: "Dulcimer", folder: "015-dulcimer" },
    // Organ
    { name: "Drawbar Organ", folder: "016-drawbar-organ" },
    { name: "Percussive Organ", folder: "017-percussive-organ" },
    { name: "Rock Organ", folder: "018-rock-organ" },
    { name: "Church Organ", folder: "019-church-organ" },
    { name: "Reed Organ", folder: "020-reed-organ" },
    { name: "Accordion", folder: "021-accordion" },
    { name: "Harmonica", folder: "022-harmonica" },
    { name: "Tango Accordion", folder: "023-tango-accordion" },
    // Guitar
    { name: "Acoustic Guitar (nylon)", folder: "024-acoustic-guitar-nylon" },
    { name: "Acoustic Guitar (steel)", folder: "025-acoustic-guitar-steel" },
    { name: "Electric Guitar (jazz)", folder: "026-electric-guitar-jazz" },
    { name: "Electric Guitar (clean)", folder: "027-electric-guitar-clean" },
    { name: "Electric Guitar (muted)", folder: "028-electric-guitar-muted" },
    { name: "Overdriven Guitar", folder: "029-overdriven-guitar" },
    { name: "Distortion Guitar", folder: "030-distortion-guitar" },
    { name: "Guitar harmonics", folder: "031-guitar-harmonics" },
    // Bass
    { name: "Acoustic Bass", folder: "032-acoustic-bass" },
    { name: "Electric Bass (finger)", folder: "033-electric-bass-finger" },
    { name: "Electric Bass (pick)", folder: "034-electric-bass-pick" },
    { name: "Fretless Bass", folder: "035-fretless-bass" },
    { name: "Slap Bass 1", folder: "036-slap-bass-1" },
    { name: "Slap Bass 2", folder: "037-slap-bass-2" },
    { name: "Synth Bass 1", folder: "038-synth-bass-1" },
    { name: "Synth Bass 2", folder: "039-synth-bass-2" },
    // Strings
    { name: "Violin", folder: "040-violin" },
    { name: "Viola", folder: "041-viola" },
    { name: "Cello", folder: "042-cello" },
    { name: "Contrabass", folder: "043-contrabass" },
    { name: "Tremolo Strings", folder: "044-tremolo-strings" },
    { name: "Pizzicato Strings", folder: "045-pizzicato-strings" },
    { name: "Orchestral Harp", folder: "046-orchestral-harp" },
    { name: "Timpani", folder: "047-timpani" },
    // Ensemble
    { name: "String Ensemble 1", folder: "048-string-ensemble-1" },
    { name: "String Ensemble 2", folder: "049-string-ensemble-2" },
    { name: "Synth Strings 1", folder: "050-synth-strings-1" },
    { name: "Synth Strings 2", folder: "051-synth-strings-2" },
    { name: "Choir Aahs", folder: "052-choir-aahs" },
    { name: "Voice Oohs", folder: "053-voice-oohs" },
    { name: "Synth Voice", folder: "054-synth-voice" },
    { name: "Orchestra Hit", folder: "055-orchestra-hit" },
    // Brass
    { name: "Trumpet", folder: "056-trumpet" },
    { name: "Trombone", folder: "057-trombone" },
    { name: "Tuba", folder: "058-tuba" },
    { name: "Muted Trumpet", folder: "059-muted-trumpet" },
    { name: "French Horn", folder: "060-french-horn" },
    { name: "Brass Section", folder: "061-brass-section" },
    { name: "Synth Brass 1", folder: "062-synth-brass-1" },
    { name: "Synth Brass 2", folder: "063-synth-brass-2" },
    // Reed
    { name: "Soprano Sax", folder: "064-soprano-sax" },
    { name: "Alto Sax", folder: "065-alto-sax" },
    { name: "Tenor Sax", folder: "066-tenor-sax" },
    { name: "Baritone Sax", folder: "067-baritone-sax" },
    { name: "Oboe", folder: "068-oboe" },
    { name: "English Horn", folder: "069-english-horn" },
    { name: "Bassoon", folder: "070-bassoon" },
    { name: "Clarinet", folder: "071-clarinet" },
    // Pipe
    { name: "Piccolo", folder: "072-piccolo" },
    { name: "Flute", folder: "073-flute" },
    { name: "Recorder", folder: "074-recorder" },
    { name: "Pan Flute", folder: "075-pan-flute" },
    { name: "Blown Bottle", folder: "076-blown-bottle" },
    { name: "Shakuhachi", folder: "077-shakuhachi" },
    { name: "Whistle", folder: "078-whistle" },
    { name: "Ocarina", folder: "079-ocarina" },
    // Synth Lead
    { name: "Lead 1 (square)", folder: "080-lead-1-square" },
    { name: "Lead 2 (sawtooth)", folder: "081-lead-2-sawtooth" },
    { name: "Lead 3 (calliope)", folder: "082-lead-3-calliope" },
    { name: "Lead 4 (chiff)", folder: "083-lead-4-chiff" },
    { name: "Lead 5 (charang)", folder: "084-lead-5-charang" },
    { name: "Lead 6 (voice)", folder: "085-lead-6-voice" },
    { name: "Lead 7 (fifths)", folder: "086-lead-7-fifths" },
    { name: "Lead 8 (bass + lead)", folder: "087-lead-8-bass-lead" },
    // Synth Pad
    { name: "Pad 1 (new age)", folder: "088-pad-1-new-age" },
    { name: "Pad 2 (warm)", folder: "089-pad-2-warm" },
    { name: "Pad 3 (polysynth)", folder: "090-pad-3-polysynth" },
    { name: "Pad 4 (choir)", folder: "091-pad-4-choir" },
    { name: "Pad 5 (bowed)", folder: "092-pad-5-bowed" },
    { name: "Pad 6 (metallic)", folder: "093-pad-6-metallic" },
    { name: "Pad 7 (halo)", folder: "094-pad-7-halo" },
    { name: "Pad 8 (sweep)", folder: "095-pad-8-sweep" },
    // Synth Effects
    { name: "FX 1 (rain)", folder: "096-fx-1-rain" },
    { name: "FX 2 (soundtrack)", folder: "097-fx-2-soundtrack" },
    { name: "FX 3 (crystal)", folder: "098-fx-3-crystal" },
    { name: "FX 4 (atmosphere)", folder: "099-fx-4-atmosphere" },
    { name: "FX 5 (brightness)", folder: "100-fx-5-brightness" },
    { name: "FX 6 (goblins)", folder: "101-fx-6-goblins" },
    { name: "FX 7 (echoes)", folder: "102-fx-7-echoes" },
    { name: "FX 8 (sci-fi)", folder: "103-fx-8-sci-fi" },
    // Ethnic
    { name: "Sitar", folder: "104-sitar" },
    { name: "Banjo", folder: "105-banjo" },
    { name: "Shamisen", folder: "106-shamisen" },
    { name: "Koto", folder: "107-koto" },
    { name: "Kalimba", folder: "108-kalimba" },
    { name: "Bagpipe", folder: "109-bagpipe" },
    { name: "Fiddle", folder: "110-fiddle" },
    { name: "Shanai", folder: "111-shanai" },
    // Percussive
    { name: "Tinkle Bell", folder: undefined },
    { name: "Agogo", folder: undefined },
    { name: "Steel Drums", folder: undefined },
    { name: "Woodblock", folder: undefined },
    { name: "Taiko Drum", folder: undefined },
    { name: "Melodic Tom", folder: undefined },
    { name: "Synth Drum", folder: undefined },
    { name: "Reverse Cymbal", folder: undefined },
    // Sound effects
    { name: "Guitar Fret Noise", folder: "120-guitar-fret-noise" },
    { name: "Breath Noise", folder: "121-breath-noise" },
    { name: "Seashore", folder: "122-seashore" },
    { name: "Bird Tweet", folder: "123-bird-tweet" },
    { name: "Telephone Ring", folder: "124-telephone-ring" },
    { name: "Helicopter", folder: "125-helicopter" },
    { name: "Applause", folder: "126-applause" },
    { name: "Gunshot", folder: "127-gunshot" },
];

if (GM_INSTRUMENTS.length !== 128)
    throw "Invalid GM_INSTRUMENTS length!";

/**
 * Returns official General MIDI instrument name for a program number.
 * @param programNumber 0–127
 */
export function getMidiInstrumentName(programNumber: number): string | undefined {
    return GM_INSTRUMENTS[programNumber]?.name;
}

const samplesBaseUrl = "https://cdn.jsdelivr.net/npm/web-music-score-samples@3.0.0";
// const samplesBaseUrl = "http://localhost:3000";

export function registerMidiInstruments() {
    for (const { name, folder } of GM_INSTRUMENTS) {
        if (folder) {
            registerInstrument(
                new SamplesInstrument(`${samplesBaseUrl}/samples/${folder}/samples.json`),
                name
            );
        }
    }
}
