import { useSound } from 'use-sound';
import { spritemap } from './bobo_sfx';



const useSFX = (SERVER_PATH) => {
    const [play] = useSound(`${SERVER_PATH}/audio/bobo_sfx.mp3`, {
        sprite: spritemap,
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

export { useSFX, useMusic }