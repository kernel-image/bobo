import { Html } from '@react-three/drei'
import { useEffect } from 'react'

const StatusUI = ({ round, points, swings, time }) => {

    return (
        <Html transform={true} position={[-0.058, 0.18, -0.2]} scale={0.02}>
            <style>{`
                .UIWrapper {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 20%;
                    pointer-events: none;
                }
                .UIContainer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content left;    
                }
                .UIContent {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    background-color: rgba(255, 255, 255, 0.25);
                    border-radius: 0.5rem;
                    padding: 0.25rem;
                    margin: 0.25rem;
                }
                .UIItem {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: left;
                    pointer-events: none;
                    margin: 0.5rem;
                    padding: 0.5rem;
                    background-color: rgba(255, 255, 255, 0.7);
                    border-radius: 0.5rem;
                }
                .UIItemTitle {
                    font-size: 0.5rem;
                    font-weight: bold;
                    pointer-events: none;
                    color: black;
                }
                .UIItemValue {
                    font-size: 1 rem;
                    font-weight: bold;
                    pointer-events: none;
                    color: black;
                }`
            }</style>
            <div className='UIWrapper'>
                <div className='UIContainer'>
                    <div className='UIContent'>
                        <div className='UIItem'>
                            <div className='UIItemTitle'>Round</div>
                            <div className='UIItemValue'>{round}</div>
                        </div>
                        <div className='UIItem'>
                            <div className='UIItemTitle'>Points</div>
                            <div className='UIItemValue'>{Math.round(points) || 0}</div>
                        </div>
                        <div className='UIItem'>
                            <div className='UIItemTitle'>Swings</div>
                            <div className='UIItemValue'>{swings || 0}</div>
                        </div>
                        <div className='UIItem'>
                            <div className='UIItemTitle'>Time</div>
                            <div className='UIItemValue'>{time}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Html>
    )
}

export { StatusUI }