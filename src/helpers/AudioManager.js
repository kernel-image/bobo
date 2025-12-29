'use client'

import { useMemo, useCallback } from 'react';
import { useSafeSound as useAudio } from './useSafeAudio';
import { spritemap as SFXspritemap } from './bobo_sfx';
import { spritemap as VOspritemap } from './bobo_vo';

//console.log(SFXspritemap)
//console.log(VOspritemap)

const useSFX = (SERVER_PATH) => {
  const [play] = useAudio(`${SERVER_PATH}/audio/bobo_sfx.mp3`, {
    sprite: SFXspritemap,
    loop: false,
  });

  // Return a safe play function that handles readiness internally
  return useCallback((...args) => {
    // Extract sprite name from arguments if provided
    const sprite = args[0];
    const options = args[1];
    return play(sprite, options);
  }, [play]);
};

const useMusic = (SERVER_PATH) => {
  const [play, { stop }] = useAudio(`${SERVER_PATH}/audio/organ_grinder_01.mp3`, {
    loop: true,
    playbackRate: 0.8,
    interrupt: true,
  });

  return useMemo(() => ({
    play: (...args) => {
      const sprite = args[0];
      const options = args[1];
      return play(sprite, options);
    },
    stop: stop, // useSafeAudio's stop handles readiness internally
  }), [play, stop]);
};

const useVO = (SERVER_PATH) => {
  const [play, { sound }] = useAudio(`${SERVER_PATH}/audio/bobo_vo.mp3`, {
    sprite: VOspritemap,
    loop: false,
    interrupt: true,
  });

  return useMemo(() => ({
    play: (...args) => {
      const sprite = args[0];
      const options = args[1];
      return play(sprite, options);
    },
    sound,
  }), [play, sound]);
};

const getRandomID = (tag) => {
  const voKeys = getVO(tag);
  if (voKeys.length === 0) return null;
  const idx = Math.floor(Math.random() * voKeys.length);
  const id = voKeys[idx];
  return id;
};

const getVO = (tag) =>
  Object.keys(VOspritemap).filter((key) => {
    if (key.includes(tag)) {
      return key;
    }
  });

export { useSFX, useMusic, useVO, getRandomID };
