import { useSound } from 'use-sound';
import { spritemap as SFXspritemap } from './bobo_sfx';
import { spritemap as VOspritemap } from './bobo_vo';



const useSFX = (SERVER_PATH) => {
    const [play] = useSound(`${SERVER_PATH}/audio/bobo_sfx.mp3`, {
        sprite: SFXspritemap,
        loop: false,
    });
    //console.log(spritemap)
    return play;
}

const useMusic = (SERVER_PATH) => {
    const [play] = useSound(`${SERVER_PATH}/audio/organ_grinder_01.mp3`, {
        loop: true,
        playbackRate: 0.8
    });
    return play;
}

const useVO = (SERVER_PATH) => {
    const [play] = useSound(`${SERVER_PATH}/audio/bobo_vo.mp3`, {
        sprite: VOspritemap,
        loop: false,
    });
    return { play, selectInactivityVO };
}

const inactivityVO = Object.keys(VOspritemap).map((key) => {
    if (key.includes('inactivity')) {
        return key
    }
})

const selectInactivityVO = () => {
    const idx = Math.floor(Math.random() * inactivityVO.length)
    const id = inactivityVO[idx]
    return id
}

//TODO:  add VO asset and spritemap

export { useSFX, useMusic, useVO }