import { useSound } from 'use-sound'
import { spritemap as SFXspritemap } from './bobo_sfx'
import { spritemap as VOspritemap } from './bobo_vo'

//console.log(SFXspritemap)
//console.log(VOspritemap)

const useSFX = (SERVER_PATH) => {
  const [play] = useSound(`${SERVER_PATH}/audio/bobo_sfx.mp3`, {
    sprite: SFXspritemap,
    loop: false,
  })
  return play
}

const useMusic = (SERVER_PATH) => {
  const [play] = useSound(`${SERVER_PATH}/audio/organ_grinder_01.mp3`, {
    loop: true,
    playbackRate: 0.8,
    interrupt: true,
  })
  return play
}

const useVO = (SERVER_PATH) => {
  const [play, { sound }] = useSound(`${SERVER_PATH}/audio/bobo_vo.mp3`, {
    sprite: VOspritemap,
    loop: false,
    interrupt: true,
    onEnd: () => {},
  })
  return { play, sound }
}

const getRandomID = (tag) => {
  const voKeys = getVO(tag)
  const idx = Math.floor(Math.random() * voKeys.length)
  const id = voKeys[idx]
  return id
}

const getVO = (tag) =>
  Object.keys(VOspritemap).filter((key) => {
    if (key.includes(tag)) {
      return key
    }
  })

export { useSFX, useMusic, useVO, getRandomID }
