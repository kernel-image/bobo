import { useSound } from 'use-sound';
import { spritemap } from './bobo_sfx';



const useSFX = () => {
    const [play] = useSound('/audio/bobo_sfx.mp3', {
        sprite: spritemap,
        loop: false,
    });
    //console.log(spritemap)
    return play;
}

const useMusic = () => {
    const [play] = useSound('/audio/organ_grinder_01.mp3', {
        loop: true,
        playbackRate: 0.8
    });
    return play;
}

export { useSFX, useMusic }