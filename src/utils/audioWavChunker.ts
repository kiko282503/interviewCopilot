export interface WavChunkerHandle {
  stop: () => void;
}

function downsampleTo16kWithAgc(samples: Float32Array, inputSampleRate: number, chunkPeak: number): Int16Array {
  // Normalize quiet system/mic audio cleanly without over-amplifying room noise
  const safePeak = Math.max(0.05, chunkPeak);
  const gain = Math.min(6.0, Math.max(1.0, 0.65 / safePeak));

  if (inputSampleRate === 16000) {
    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-0.96, Math.min(0.96, samples[i] * gain));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.floor(samples.length / ratio));
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += samples[j];
      count++;
    }
    const avg = count > 0 ? sum / count : samples[start] || 0;
    const clamped = Math.max(-0.96, Math.min(0.96, avg * gain));
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return result;
}

function encodeWavBase64(pcm16: Int16Array, sampleRate = 16000): string {
  const buffer = new ArrayBuffer(44 + pcm16.byteLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcm16.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcm16.byteLength, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Captures PCM from any Web Audio MediaStreamAudioSourceNode (mic, tab/system audio, or mixed),
 * applies AGC normalization for quiet audio, and emits standalone 16kHz Mono WAV clips on pause or max duration.
 */
export function startWavSpeechChunker(options: {
  audioCtx: AudioContext;
  sourceNode: AudioNode;
  onSpeechChunk: (wavBase64: string) => void;
}): WavChunkerHandle {
  const { audioCtx, sourceNode, onSpeechChunk } = options;

  const bufferSize = 4096;
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  const silentGain = audioCtx.createGain();
  silentGain.gain.value = 0;

  let chunks: Float32Array[] = [];
  let totalSamples = 0;
  let hasSpeechInBuffer = false;
  let maxPeakInBuffer = 0;
  let lastSpeechTime = 0;
  let stopped = false;

  const sampleRate = audioCtx.sampleRate || 48000;
  const maxSamples = Math.floor(sampleRate * 6.5); // Capture full sentences cleanly up to 6.5s
  const minSamples = Math.floor(sampleRate * 0.4); // Ignore sub-400ms clicks/noises

  const flush = () => {
    if (totalSamples < minSamples || !hasSpeechInBuffer || maxPeakInBuffer < 0.006) {
      chunks = [];
      totalSamples = 0;
      hasSpeechInBuffer = false;
      maxPeakInBuffer = 0;
      return;
    }

    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    const peakForChunk = maxPeakInBuffer;
    chunks = [];
    totalSamples = 0;
    hasSpeechInBuffer = false;
    maxPeakInBuffer = 0;

    const pcm16 = downsampleTo16kWithAgc(merged, sampleRate, peakForChunk);
    const wavBase64 = encodeWavBase64(pcm16, 16000);
    onSpeechChunk(wavBase64);
  };

  processor.onaudioprocess = (e) => {
    if (stopped) return;
    const input = e.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);

    let peak = 0;
    let sumSq = 0;
    for (let i = 0; i < copy.length; i++) {
      const v = copy[i];
      const abs = v < 0 ? -v : v;
      if (abs > peak) peak = abs;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / copy.length);
    const now = performance.now();

    if (peak >= 0.006 || rms >= 0.0018) {
      hasSpeechInBuffer = true;
      if (peak > maxPeakInBuffer) maxPeakInBuffer = peak;
      lastSpeechTime = now;
    }

    // Retain ~0.5s leading context before speech starts so opening phonemes aren't clipped
    if (!hasSpeechInBuffer && totalSamples > Math.floor(sampleRate * 0.5)) {
      chunks.shift();
      totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);
    }

    chunks.push(copy);
    totalSamples += copy.length;

    const silenceElapsed = now - lastSpeechTime;
    if (hasSpeechInBuffer && totalSamples >= minSamples && silenceElapsed >= 550) {
      flush();
    } else if (totalSamples >= maxSamples) {
      flush();
    }
  };

  sourceNode.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(audioCtx.destination);

  return {
    stop: () => {
      stopped = true;
      try {
        flush();
      } catch {}
      try {
        processor.disconnect();
        silentGain.disconnect();
      } catch {}
    },
  };
}
