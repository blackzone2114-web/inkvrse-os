export type AudioLevelSample = {
  rms: number;
  peak: number;
  smoothed: number;
};

export function createAudioLevelAnalyser(stream: MediaStream, onSample: (sample: AudioLevelSample) => void) {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.68;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let raf = 0;
  let smoothed = 0;

  const tick = () => {
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    let peak = 0;
    for (let index = 0; index < buffer.length; index += 1) {
      const value = Math.abs(buffer[index] ?? 0);
      sum += value * value;
      if (value > peak) peak = value;
    }

    const rms = Math.sqrt(sum / buffer.length);
    const target = Math.min(1, Math.max(0, (rms - 0.012) / 0.24));
    const attack = 0.42;
    const release = 0.16;
    smoothed += (target - smoothed) * (target > smoothed ? attack : release);

    onSample({ rms, peak, smoothed });
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return async () => {
    cancelAnimationFrame(raf);
    source.disconnect();
    analyser.disconnect();
    await context.close();
  };
}
