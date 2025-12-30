'use client'

// helpers/useSafeAudio.js
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const useSafeSound = (url, options = {}) => {
  const soundRef = useRef(null);
  const queueRef = useRef([]); // Restore queue for early play calls
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);

  // Destructure options to separate playbackRate and others
  const { playbackRate = 1, volume = 1, loop = false, sprite, interrupt, onload, ...restOptions } = options;

  const spriteString = useMemo(() => JSON.stringify(sprite), [sprite]);
  const onloadRef = useRef(onload);
  useEffect(() => {
    onloadRef.current = onload;
  }, [onload]);

  useEffect(() => {
    let sound = null;

    const initHowler = async () => {
      // Dynamically import howler to prevent SSR issues
      const { Howl } = await import('howler');

      sound = new Howl({
        src: [url],
        volume,
        loop,
        sprite,
        rate: playbackRate, // Set rate correctly on initialization
        onload: () => {
          setIsLoaded(true);
          setDuration(sound.duration());
          if (onloadRef.current) onloadRef.current();
        },
        ...restOptions,
      });

      soundRef.current = sound;
    };

    initHowler();

    return () => {
      if (sound) {
        sound.unload();
      }
    };
    // We explicitly only want to re-initialize if the source URL or sprite map changes.
    // Other properties like volume and rate are handled reactively by dedicated effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, spriteString]); 

  // Update specific properties reactively without destroying the instance
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.rate(playbackRate);
    }
  }, [playbackRate]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.loop(loop);
    }
  }, [loop]);

  const play = useCallback((...args) => {
    if (soundRef.current && isLoaded) { // Only play immediately if loaded
       // Handle interrupt logic: stop any existing instances before playing a new one
       if (interrupt) {
        soundRef.current.stop();
       }

       let spriteName;
       let options = {};

       if (args.length > 0) {
         const arg0 = args[0];
         if (typeof arg0 === 'string') {
           spriteName = arg0;
           if (args.length > 1 && typeof args[1] === 'object') {
             options = args[1];
           }
         } else if (typeof arg0 === 'object' && arg0 !== null) {
           options = arg0;
           if (options.id) {
             spriteName = options.id;
           }
         }
       }

      const soundId = soundRef.current.play(spriteName);

      // Apply per-play options to this specific sound instance
      if (soundId && options) {
        if (typeof options.playbackRate === 'number') {
          soundRef.current.rate(options.playbackRate, soundId);
        }
        if (typeof options.volume === 'number') {
          soundRef.current.volume(options.volume, soundId);
        }
      }

      return soundId;
    } else {
      // Queue the call if not yet loaded
      queueRef.current.push(args);
      return null;
    }
  }, [interrupt, isLoaded]); // Depend on isLoaded to switch from queueing to playing

  // Flush queue when loaded
  useEffect(() => {
    if (isLoaded && soundRef.current && queueRef.current.length > 0) {
      queueRef.current.forEach(args => {
        play(...args);
      });
      queueRef.current = [];
    }
  }, [isLoaded, play]);

  const stop = useCallback((id) => {
    if (soundRef.current) {
      soundRef.current.stop(id);
    }
  }, []);

  const pause = useCallback((id) => {
    if (soundRef.current) {
      soundRef.current.pause(id);
    }
  }, []);

  // Return API compatible with previous implementation
  return [
    play,
    {
      sound: soundRef.current,
      stop,
      pause,
      duration,
    },
  ];
};

export { useSafeSound };