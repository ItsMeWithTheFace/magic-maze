import gql from 'graphql-tag';
import React, { Component } from 'react';
import Viewport from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import {
  Button, Modal, ModalHeader,
  ModalBody, ModalFooter,
} from 'reactstrap';
import { toast } from 'react-toastify';
import client from '../common/utils';
import spritesheet from '../assets/spritesheet.png';
import Timer from './Timer';
import './Board.css';
import {
  ENDTIME_QUERY,
  CHARACTER_UPDATED_QUERY,
  MAZETILE_UPDATED_QUERY,
  END_GAME_QUERY,
  ITEMS_CLAIMED_QUERY,
} from '../common/queries';


// constants
const SCALE = 4;
const TILE_SIZE = 16;
const MAZE_SIZE = 64;
const X_OFFSET = 350;
const Y_OFFSET = 80;
const GAME_ID = '5c9fd4f2dfc68c2c5710752e';

// fontawesome
library.add(faSearch);

// PIXI elements
let app;
let viewport;

// maze tile sprites
const spriteList = [
  { url: spritesheet },
  { url: require('../assets/maze/0.png') },
  { url: require('../assets/maze/1.png') },
  { url: require('../assets/maze/2.png') },
  { url: require('../assets/maze/3.png') },
  { url: require('../assets/maze/4.png') },
  { url: require('../assets/maze/5.png') },
  { url: require('../assets/maze/6.png') },
  { url: require('../assets/maze/7.png') },
  { url: require('../assets/maze/8.png') },
  { url: require('../assets/maze/9.png') },
  { url: require('../assets/maze/10.png') },
  { url: require('../assets/maze/11.png') },
];

let characterContainer;
let mazeContainer;
let artifactContainer;

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: '',               // selected character colour (will refactor this later)
      players: [],                // character objects
      selector: null,             // cross-hair object
      gameEndTime: new Date(),    // end time (for timer)
      itemsClaimed: false,        // whether or not all the items have been claimed
      doTick: true,               // whether or not the timer should tick
      gameOver: false,            // whether or not the game is done or not
    };

    viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });

    app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    app.renderer.backgroundColor = 0x334D5C;
    app.stage.addChild(viewport);
    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .on('clicked', this.move);

    // set scale mode (so pixels aren't blurry when scaling)
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    characterContainer = new PIXI.Container();
    mazeContainer = new PIXI.Container();
    artifactContainer = new PIXI.Container();
  }

  // serve board
  componentDidMount() {
    document.getElementById('board').appendChild(app.view);
    document.body.style.overflow = 'hidden';
    PIXI.Loader.shared.reset();
    PIXI.Loader.shared
      .add(spriteList)
      .load(this.setup);

    client().subscribe({ query: ENDTIME_QUERY(GAME_ID), variables: { gameStateID: GAME_ID } })
      .forEach(time => this.setState({ gameEndTime: new Date(time.data.endTimeUpdated) }));

    // get colour and set character state
    client().subscribe({ query: CHARACTER_UPDATED_QUERY(GAME_ID), variables: { gameStateID: GAME_ID } })
      .forEach((results) => {
        const { players, selector } = this.state;

        // update selected character
        const colour = results.data.characterUpdated.colour;

        if (results.data.characterUpdated.itemClaimed) {
          if (!players[colour].itemClaimed) {
            toast.success(`👌🏻 ${colour} item claimed`, {
              position: 'bottom-right',
            });
          }
        }

        // update character position
        const characterList = players;
        characterList[colour].x = results.data.characterUpdated.coordinates.x * TILE_SIZE * SCALE + X_OFFSET;
        characterList[colour].y = results.data.characterUpdated.coordinates.y * TILE_SIZE * SCALE + Y_OFFSET;
        characterList[colour].itemClaimed = results.data.characterUpdated.itemClaimed;

        // update selector position
        const selectorObj = selector;
        selectorObj.x = characterList[colour].x;
        selectorObj.y = characterList[colour].y;

        this.setState({
          selected: colour,
          players: characterList,
          selector: selectorObj,
        });
      });

    // set add mazeTile
    client().subscribe({ query: MAZETILE_UPDATED_QUERY(GAME_ID), variables: { gameStateID: GAME_ID } })
      .forEach((results) => {
        const newTileTexture = new PIXI.Texture(
          PIXI.utils.TextureCache[require(`../assets/maze/${results.data.mazeTileAdded.spriteID}.png`)],
          new PIXI.Rectangle(0, 0, MAZE_SIZE, MAZE_SIZE),
        );
        const newTile = new PIXI.Sprite(newTileTexture);
        // adding a pivot affects the position of the tile
        // must offset by (WIDTH / 2) * SCALE to counteract this
        newTile.x = results.data.mazeTileAdded.cornerCoordinates.x * (TILE_SIZE * SCALE) + X_OFFSET + (MAZE_SIZE / 2) * 4;
        newTile.y = results.data.mazeTileAdded.cornerCoordinates.y * (TILE_SIZE * SCALE) + Y_OFFSET + (MAZE_SIZE / 2) * 4;
        // add pivot in the centre of the tile
        newTile.pivot.set(MAZE_SIZE / 2);
        newTile.scale.set(SCALE, SCALE);
        newTile.angle = results.data.mazeTileAdded.orientation * (-90);
        mazeContainer.addChild(newTile);
      });

    // display message if all items have been claimed
    client().subscribe({ query: ITEMS_CLAIMED_QUERY(GAME_ID), variables: { gameStateID: GAME_ID } })
      .forEach(() => {
        toast.info('🙌🏻 all items have been claimed! all vortexes disabled! time to escape!', {
          position: 'bottom-right',
          autoClose: false,
        });
        this.setState({
          itemsClaimed: true,
        });
      });

    // end the game if true
    client().subscribe({ query: END_GAME_QUERY(GAME_ID), variables: { gameStateID: GAME_ID } })
      .forEach(() => {
        this.setState({
          doTick: false,
          gameOver: true,
        });
      });
  }

  /**
   * call backend and do initial setup
   */
  setup = () => {
    const {
      players,
    } = this.state;
    const query = gql`
      {
        gameState(gameStateID: "${GAME_ID}") {
          mazeTiles {
            cornerCoordinates {
              x
              y
            }
            spriteID
            orientation
          }
          endTime
          allItemsClaimed
          characters {
            colour
            itemClaimed
            coordinates {
              x
              y
            }
          }
        }
      }
    `;
    client().query({ query }).then((results) => {
      this.setState({
        gameEndTime: new Date(results.data.gameState.endTime),
        itemsClaimed: results.data.gameState.allItemsClaimed,
      });

      // render and create characters
      players.red = this.createCharacter(3, results.data.gameState.characters.find(x => x.colour === 'red'));
      players.purple = this.createCharacter(0, results.data.gameState.characters.find(x => x.colour === 'purple'));
      players.blue = this.createCharacter(1, results.data.gameState.characters.find(x => x.colour === 'blue'));
      players.green = this.createCharacter(2, results.data.gameState.characters.find(x => x.colour === 'green'));

      // render initial maze tile
      const startTileTexture = new PIXI.Texture(
        PIXI.utils.TextureCache[require('../assets/maze/0.png')],
        new PIXI.Rectangle(0, 0, MAZE_SIZE, MAZE_SIZE),
      );
      const startTile = new PIXI.Sprite(startTileTexture);
      startTile.x = X_OFFSET;
      startTile.y = Y_OFFSET;
      startTile.scale.set(SCALE, SCALE);

      // render pre-existing maze tiles
      const tiles = results.data.gameState.mazeTiles.filter(x => x.cornerCoordinates !== null);
      tiles.forEach((tile) => {
        const texture = new PIXI.Texture(
          PIXI.utils.TextureCache[require(`../assets/maze/${tile.spriteID}.png`)],
          new PIXI.Rectangle(0, 0, MAZE_SIZE, MAZE_SIZE),
        );
        const newTile = new PIXI.Sprite(texture);
        newTile.x = tile.cornerCoordinates.x * (TILE_SIZE * SCALE) + X_OFFSET + (MAZE_SIZE / 2) * 4;
        newTile.y = tile.cornerCoordinates.y * (TILE_SIZE * SCALE) + Y_OFFSET + (MAZE_SIZE / 2) * 4;
        newTile.pivot.set(MAZE_SIZE / 2);
        newTile.scale.set(SCALE, SCALE);
        newTile.angle = tile.orientation * (-90);
        mazeContainer.addChild(newTile);
      });

      // add actors to containers
      // (we do this to manipulate the z-index properly)
      mazeContainer.addChild(startTile);
      characterContainer.addChild(players.red);
      characterContainer.addChild(players.purple);
      characterContainer.addChild(players.blue);
      characterContainer.addChild(players.green);

      // add containers to viewport
      // (cannot add to stage otherwise scrolling will not work)
      viewport.addChild(mazeContainer);
      viewport.addChild(characterContainer);
    });
  }

  /**
   * move the selected character based on selected option
   * move algorithm:
   * - calculate the delta between the click and the character's position
   * - convert delta to the number of tile spaces to increase this by
   *     (i.e. this should return the number of tiles moved; integer between 0 and n)
   * - scale up the coordinate to the actual coordinate
   * @param {*} e click event
   */
  move = (e) => {
    const { selected, players } = this.state;
    if (selected) {
      const endX = players[selected].x + Math.floor((e.world.x - players[selected].x)
      / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);
      const endY = players[selected].y + Math.floor((e.world.y - players[selected].y)
      / (TILE_SIZE * SCALE)) * (TILE_SIZE * SCALE);

      const deltaX = (endX - X_OFFSET) / (TILE_SIZE * SCALE);
      const deltaY = (endY - Y_OFFSET) / (TILE_SIZE * SCALE);
      const mutation = gql`
        mutation {
          moveCharacter(
            gameStateID: "${GAME_ID}",
            userID: null,
            characterColour: "${selected}",
            endTileCoords:{ x: ${deltaX}, y: ${deltaY} },
          ) {
            _id
            colour
            coordinates {
              x
              y
            }
          }
        }
      `;
      client().mutate({ mutation });
    }
  }

  /**
   * create a new character
   * @param {*} offset offset value in the spritesheet (hard-coded)
   * @param {*} data the character JSON
   */
  createCharacter = (offset, data) => {
    const {
      selected,
    } = this.state;

    const texture = new PIXI.Texture(
      PIXI.utils.TextureCache[spritesheet],
      new PIXI.Rectangle(offset * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE),
    );
    const character = new PIXI.Sprite(texture);
    character.x = data.coordinates.x * (TILE_SIZE * SCALE) + X_OFFSET;
    character.y = data.coordinates.y * (TILE_SIZE * SCALE) + Y_OFFSET;
    character.itemClaimed = data.itemClaimed;
    character.scale.set(SCALE, SCALE);
    character.interactive = true;
    // sprite handling can only be caught using 'click'
    // (this is different from the viewport for some reason...)
    character.on('click', () => {
      // initialize selector sprite
      const selectorTexture = new PIXI.Texture(
        PIXI.utils.TextureCache[spritesheet],
        new PIXI.Rectangle(5 * TILE_SIZE, 4 * TILE_SIZE, TILE_SIZE, TILE_SIZE),
      );
      const selectorObject = new PIXI.Sprite(selectorTexture);
      selectorObject.x = character.x;
      selectorObject.y = character.y;
      selectorObject.scale.set(SCALE, SCALE);
      this.setState({
        selector: selectorObject,
      });

      // if there is nothing selected
      if (selected === '') {
        // add the selector icon
        artifactContainer.addChild(selectorObject);
        viewport.addChild(artifactContainer);
      // if swapping selected character
      } else if (selected !== data.colour) {
        // remove all selectors
        for (let i = 0; i < artifactContainer.children.length; i += 1) {
          artifactContainer.removeChildAt(i);
        }
        // add the new selector
        artifactContainer.addChild(selectorObject);
        viewport.addChild(artifactContainer);
      } else {
        // remove all selectors
        for (let i = 0; i < artifactContainer.children.length; i += 1) {
          artifactContainer.removeChildAt(i);
        }
      }

      // set selected character
      // NOTE: may need to adjust the logic game logic for freeing selected characters
      this.setState({
        selected: selected === '' || selected !== data.colour ? data.colour : '',
      });
    });
    return character;
  }

  /**
   * search for a new maze tile upon encountering a search tile
   */
  search = () => {
    const { selected, players } = this.state;

    if (selected) {
      const x = (players[selected].x - X_OFFSET) / (TILE_SIZE * SCALE);
      const y = (players[selected].y - Y_OFFSET) / (TILE_SIZE * SCALE);
      const mutation = gql`
        mutation {
          searchAction (
            gameStateID: "${GAME_ID}",
            characterCoords: { x: ${x}, y: ${y} },
          ) {
            spriteID
            orientation
            cornerCoordinates {
              x
              y
            }
          }
        }
      `;
      console.log(mutation);
      client().mutate({ mutation });
    }
  }

  render() {
    let message;
    const {
      itemsClaimed, gameOver, doTick, gameEndTime,
    } = this.state;
    const { history } = this.props;

    if (itemsClaimed) {
      message = <div className="message">All items have been claimed! All vortexes are disabled!</div>;
    }

    return (
      <div>
        {/* game win modal */}
        <Modal isOpen={gameOver} size="lg">
          <ModalHeader>
            <span role="img" aria-label="party">🎉</span>
            &nbsp;YOU WON!&nbsp;
            <span role="img" aria-label="party">🎉</span>
          </ModalHeader>
          <ModalBody>
            The boys escaped in time and are free to fight a dragon or something!
          </ModalBody>
          <ModalFooter>
            <Button color="success" className="mb-1" onClick={() => history.push('/')}>Play Again</Button>
          </ModalFooter>
        </Modal>
        <Timer history={history} endTime={gameEndTime} doTick={doTick} />
        <div className="sidenav">
          <div className="player">kev</div>
          <div className="player">rakin</div>
          <div className="player">luc</div>
          <div className="player">not-luc</div>
          <button className="btn btn-lg btn-primary" type="button" onClick={() => this.search()}>
            <FontAwesomeIcon icon="search" />
          </button>
        </div>
        { message }
        <div id="board" />
      </div>
    );
  }
}

export default Board;
