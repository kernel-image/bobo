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
  //console.log(spritemap)
  return play
}

const useMusic = (SERVER_PATH) => {
  const [play] = useSound(`${SERVER_PATH}/audio/organ_grinder_01.mp3`, {
    loop: true,
    playbackRate: 0.8,
  })
  return play
}

const useVO = (SERVER_PATH) => {
  const [play] = useSound(`${SERVER_PATH}/audio/bobo_vo.mp3`, {
    sprite: VOspritemap,
    loop: false,
    interrupt: true,
    onEnd: () => {},
  })
  return play
}

const getRandomID = (tag) => {
  //console.log('getting vo id matching tag: ' + tag)
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
