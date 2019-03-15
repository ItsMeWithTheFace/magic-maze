import React, { Component } from 'react';
import Viewport from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import spritesheet from '../assets/spritesheet.png';
import './Board.css';

const SCALE = 4;
const TILE_SIZE = 16;
const MAZE_SIZE = 64;
const X_OFFSET = 140;
const Y_OFFSET = 80;

// load all maze tile images
function importAll(r) {
  return r.keys().map(r);
}
const images = importAll(require.context('../assets/maze/', false, /\.(png|jpe?g|svg)$/));

// create board
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  resolution: SCALE,
});
app.renderer.backgroundColor = 0x334D5C;
// set the scale mode (makes it so the pixels aren't blurry when scaling)
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// create viewport
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  interaction: app.renderer.plugins.interaction,
});

// add and setup the viewport to the stage
// this must be done before adding any sprites
app.stage.addChild(viewport);
viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate();

function setup() {
  // render the character
  const characterTexture = new PIXI.Texture(
    PIXI.utils.TextureCache[spritesheet],
    new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE),
  );
  const character = new PIXI.Sprite(characterTexture);
  character.x = X_OFFSET;
  character.y = Y_OFFSET;

  viewport.on('clicked', (e) => {
    character.x += Math.floor((e.world.x - character.x) / TILE_SIZE) * TILE_SIZE;
    character.y += Math.floor((e.world.y - character.y) / TILE_SIZE) * TILE_SIZE;

    // character.x = e.world.x;
    // character.y = e.world.y;
  });

  // render initial maze tile
  const startTileTexture = new PIXI.Texture(
    PIXI.utils.TextureCache[images[0]],
    new PIXI.Rectangle(0, 0, MAZE_SIZE, MAZE_SIZE),
  );
  const startTile = new PIXI.Sprite(startTileTexture);
  startTile.x = X_OFFSET;
  startTile.y = Y_OFFSET;

  // must add to viewport (adding to stage will not allow it to scroll)
  viewport.addChild(startTile);
  viewport.addChild(character);
}

// load character from spritesheet
const spriteList = [{ url: spritesheet }];
images.forEach((url) => {
  spriteList.push(url);
});
PIXI.Loader.shared
  .add(spriteList)
  .load(setup);

class Board extends Component {
  // serve board
  componentDidMount() {
    document.getElementById('board').appendChild(app.view);
    document.body.style.overflow = 'hidden';
  }

  render() {
    return (
      <div>
        {/* temporarily remove sidenav (not required for singleplayer) */}
        {/* <div className="sidenav">
          <div className="player">kev</div>
          <div className="player">rakin</div>
          <div className="player">luc</div>
          <div className="player">not-luc</div>
        </div> */}
        <div id="board" />
      </div>
    );
  }
}

export default Board;
