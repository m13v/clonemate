import { SpeechSynthesisAdapter } from "@assistant-ui/react";

export class DeepgramSpeechSynthesisAdapter implements SpeechSynthesisAdapter {
  private apiKey: string;
  private audioContext: AudioContext;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.audioContext = null;
  }

  async speak(text: string): Promise<SpeechSynthesisAdapter.Utterance> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const subscribers = new Set<() => void>();
    let status: SpeechSynthesisAdapter.Status = { type: "running" };

    const handleEnd = (
      reason: "finished" | "error" | "cancelled",
      error?: unknown,
    ) => {
      if (status.type === "ended") return;
      status = { type: "ended", reason, error };
      subscribers.forEach((handler) => handler());
    };

    try {
      const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text || "",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => handleEnd("finished");
      source.start();

      const utterance: SpeechSynthesisAdapter.Utterance = {
        status: { type: "running" },
        cancel: () => {
          source.stop();
          handleEnd("cancelled");
        },
        subscribe: (callback: () => void) => {
          if (status.type === "ended") {
            queueMicrotask(callback);
            return () => {};
          }
          subscribers.add(callback);
          return () => subscribers.delete(callback);
        }
      };

      return utterance;
    } catch (error) {
      console.error("deepgram tts error:", error);
      handleEnd("error", error);
      throw error;
    }
  }
}