import gql from 'graphql-tag';
import React, { Component } from 'react';
import Viewport from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import client from '../common/utils';
import spritesheet from '../assets/spritesheet.png';
import './Board.css';

// constants
const SCALE = 4;
const TILE_SIZE = 16;
const MAZE_SIZE = 64;
const X_OFFSET = 350;
const Y_OFFSET = 80;

// character objects
let selected = '';
let red; let green; let blue; let purple;

/**
 * load all the maze tiles
 * traverses file and maps all the images
 * @param {*} r regex
 */
function importAll(r) {
  return r.keys().map(r);
}
const images = importAll(require.context('../assets/maze/', false, /\.(png|jpe?g|svg)$/));

// create board
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
});
app.renderer.backgroundColor = 0x334D5C;
// set the scale mode (makes it so the pixels aren't blurry when scaling)
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// move characters based on selected option
/**
 * move the selected character
 * move algorithm:
 * - calculate the delta between the click and the character's position
 * - convert delta to the number of tile spaces to increase this by
 *     (i.e. this should return the number of tiles moved; integer between 0 and n)
 * - scale up the coordinate to the actual coordinate
 * @param {*} e click event
 */
function move(e) {
  if (selected) {
    switch (selected) {
      case 'red':
        red.x += Math.floor((e.world.x - red.x) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        red.y += Math.floor((e.world.y - red.y) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        break;
      case 'purple':
        purple.x += Math.floor((e.world.x - purple.x) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        purple.y += Math.floor((e.world.y - purple.y) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        break;
      case 'green':
        green.x += Math.floor((e.world.x - green.x) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        green.y += Math.floor((e.world.y - green.y) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        break;
      case 'blue':
        blue.x += Math.floor((e.world.x - blue.x) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        blue.y += Math.floor((e.world.y - blue.y) / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
        break;
      default:
        break;
    }
  }
}

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
  .decelerate()
  .on('clicked', move);

/**
 * create a new character
 * @param {*} offset offset value in the spritesheet (hard-coded)
 * @param {*} data the character JSON
 */
function createCharacter(offset, data) {
  const texture = new PIXI.Texture(
    PIXI.utils.TextureCache[spritesheet],
    new PIXI.Rectangle(offset * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE),
  );
  const character = new PIXI.Sprite(texture);
  character.x = data.coordinates.x * (TILE_SIZE * SCALE) + X_OFFSET;
  character.y = data.coordinates.y * (TILE_SIZE * SCALE) + Y_OFFSET;
  character.scale.set(SCALE, SCALE);
  character.interactive = true;
  // sprite handling can only be caught using 'click'
  // (this is different from the viewport for some reason...)
  character.on('click', () => {
    selected = selected === '' || selected !== data.colour ? data.colour : '';
  });
  return character;
}

/**
 * call backend and do initial setup
 */
const setup = () => {
  const query = gql`
    {
      gameState(gameStateID: "5c8c55d0f0c3cd64e4978980") {
        mazeTiles {
          cornerCoordinates {
            x
            y
          }
          spriteID
        }
        characters {
          colour
          coordinates {
            x
            y
          }
        }
      }
    }
  `;
  client().query({ query }).then((results) => {
    // render and create characters
    red = createCharacter(3, results.data.gameState.characters.find(x => x.colour === 'red'));
    purple = createCharacter(0, results.data.gameState.characters.find(x => x.colour === 'purple'));
    blue = createCharacter(1, results.data.gameState.characters.find(x => x.colour === 'blue'));
    green = createCharacter(2, results.data.gameState.characters.find(x => x.colour === 'green'));

    // render initial maze tile
    // TODO: perhaps abstract this into a separate function
    const startTileTexture = new PIXI.Texture(
      PIXI.utils.TextureCache[images[0]],
      new PIXI.Rectangle(0, 0, MAZE_SIZE, MAZE_SIZE),
    );
    const startTile = new PIXI.Sprite(startTileTexture);
    startTile.x = X_OFFSET;
    startTile.y = Y_OFFSET;
    startTile.scale.set(SCALE, SCALE);

    // add actors to the viewport
    // (cannot add to stage otherwise scrolling will not work)
    viewport.addChild(startTile);
    viewport.addChild(red);
    viewport.addChild(purple);
    viewport.addChild(blue);
    viewport.addChild(green);
  });
};

// load sprites
const spriteList = [{ url: spritesheet }];
// we read all the images in the beginning
// then add them all to this object to get the loader to load everything
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
