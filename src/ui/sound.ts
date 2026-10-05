// Sound (off by default): a low synth hum plus blips when things appear.
import { $ } from '../lib/dom';

export interface Sound {
  blip(freq?: number): void;
}

type AudioCtor = typeof AudioContext;

export function createSound(): Sound {
  let actx: AudioContext | null = null, master: GainNode | null = null, soundOn = false;
  const sndBtn = $('snd-btn');

  function ensureAudio(): AudioContext | null {
    if (actx) return actx;
    const AC: AudioCtor | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    actx = ctx;
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.connect(master);
    ([[55, 'sawtooth', 0.5], [55.4, 'sawtooth', 0.5], [110.3, 'triangle', 0.25]] as const).forEach((v) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = v[1]; o.frequency.value = v[0]; g.gain.value = v[2];
      o.connect(g); g.connect(lp); o.start();
    });
    return ctx;
  }
  function setSound(on: boolean): void {
    if (on && !ensureAudio()) return;
    soundOn = on;
    if (actx && master) {
      if (on) void actx.resume();
      master.gain.setTargetAtTime(on ? 0.05 : 0, actx.currentTime, on ? 0.4 : 0.15);
    }
    sndBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    sndBtn.textContent = '♪ ' + (on ? 'on' : 'off');
  }
  function blip(freq?: number): void {
    if (!soundOn || !actx) return;
    const t = actx.currentTime, f = freq || 880, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f / 2, t + 0.08);
    g.gain.setValueAtTime(0.035, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.13);
  }

  sndBtn.addEventListener('click', () => { setSound(!soundOn); });
  document.addEventListener('visibilitychange', () => {
    if (!actx) return;
    if (document.hidden) void actx.suspend(); else if (soundOn) void actx.resume();
  });

  return { blip };
}
