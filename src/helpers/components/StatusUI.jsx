import { Html } from '@react-three/drei'
import { UIStyle } from './UIstyle'

const StatusUI = ({ round, points, swings, time }) => {

    return (
        <Html transform={true} position={[-0.058, 0.18, -0.2]} scale={0.02}>
            <style>{UIStyle()}</style>
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
                            <div className='UIItemValue'>{Math.max(time, 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Html>
    )
}

const FinalStatusUI = ({ stats }) => {

    const getTotals = (stats) => {
        const total = Object.values(stats).reduce((acc, curr) => ({
            blows: (acc?.blows || 0) + curr.blows,
            swings: (acc?.swings || 0) + curr.swings
          }), {blows: 0, swings: 0})
        return total
    }

    const finalStats = { final: getTotals(stats) }

    const formatValue = (value) => {
        //given {points: 0, swings: 0} return `points/swings`, replacing undefined with 0
        return `${Math.round(value?.blows || 0)}/${value?.swings || 0}`
    }


    return (
        <Html transform={true} position={[-0.12, 0.18, -0.2]} scale={0.02}>
            <style>{UIStyle()}</style>
            <div className='UIWrapper'>
                <div className='UIContainer'>
                    <div className='UIContent'>
                        <h1>BOUT STATS</h1>
                        {Object.keys(stats).map((key) => {
                            return (
                                <div className='UIItem' key={key}>
                                    <div className='UIItemTitle'>{`Round ${key}`}</div>
                                    <div className='UIItemValue'>{formatValue(stats[key])}</div>
                                </div>
                            )
                        })}
                    </div>
                    <div className='UIContent'>
                        <div className='UIHeroItem'>
                        <div className='UIHeroItemTitle'>{`TOTAL`}</div>
                        <div className='UIHeroItemTitle'>{`POINTS / SWINGS`}</div>
                            {` ${formatValue(finalStats.final)}`}
                        </div>
                    </div>
                </div>
            </div>
        </Html>
    )
}

export { StatusUI, FinalStatusUI }