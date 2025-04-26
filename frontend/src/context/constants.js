// Constants for the game
export const GAME_STORAGE_KEY = 'battleship_game_state';
export const SHIPS = [
  { size: 5, id: 'ship1' },
  { size: 4, id: 'ship2' },
  { size: 3, id: 'ship3' },
  { size: 3, id: 'ship4' },
  { size: 2, id: 'ship5' }
];

export const GAME_PHASES = {
  SETUP: 'setup',
  PLAYING: 'playing',
  OVER: 'over'
};

export const GAME_MODES = {
  NORMAL: 'normal',
  EASY: 'easy'
};

export const PLAYERS = {
  HUMAN: 'Player',
  AI: 'AI'
}; 