import { GAME_STORAGE_KEY } from '../constants';

/**
 * Saves game state to localStorage
 * @param {Object} gameState - Current game state
 */
export const saveGameState = (gameState) => {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error('Could not save game state:', error);
  }
};

/**
 * Loads game state from localStorage
 * @returns {Object|null} Saved game state or null if not found
 */
export const loadGameState = () => {
  try {
    const serializedState = localStorage.getItem(GAME_STORAGE_KEY);
    return serializedState ? JSON.parse(serializedState) : null;
  } catch (error) {
    console.error('Could not load game state:', error);
    return null;
  }
};

/**
 * Clears saved game state from localStorage
 */
export const clearGameState = () => {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear game state:', error);
  }
}; 