"use client";

import { useEffect } from "react";
import { getAudioService, type AudioService } from "@/lib/audio";

/**
 * The shared AudioService. Speech is cancelled when the component unmounts so
 * a half-spoken instruction never follows the learner to the next screen.
 */
export function useAudio(): AudioService {
  const audio = getAudioService();

  useEffect(() => {
    return () => audio.stop();
  }, [audio]);

  return audio;
}
