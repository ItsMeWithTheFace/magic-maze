import { START_GAME } from '../common/consts';

const startGame = gameStateID => ({ type: START_GAME, gameStateID });

export default startGame;
