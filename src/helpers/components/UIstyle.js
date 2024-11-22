const UIStyle = () => {

    return (`
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
                    flex-direction: column;
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
                    color: black;
                    font-size: 1.5rem;
                    font-weight: bold;
                    pointer-events: none;
                    color: black;
                }
                .UIItem {
                    display: flex;
                    flex-direction: column;
                    justify-content: left;
                    margin: 0.5rem;
                    padding: 0.5rem;
                    background-color: rgba(255, 255, 255, 0.7);
                    border-radius: 0.5rem;

                }
                .UIItemTitle {
                    font-size: 0.5rem;
                }
                .UIItemValue {
                    font-size: 1 rem;
                }
                .UIHeroItemTitle {
                    font-size: 1rem;
                }
                .UIHeroItem {
                    flex-direction: row;
                    font-size: 4rem;
                    margin: 0.5rem;
                    padding: 0.5rem;
                    background-color: rgba(255, 255, 255, 0.7);
                    border-radius: 0.5rem;
                }
                `)
}

export { UIStyle }