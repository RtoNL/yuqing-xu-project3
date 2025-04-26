# Battleship Game

A full-stack implementation of the classic Battleship game using React, Node.js, Express, and MongoDB.

## Features

- User authentication (register, login, logout)
- Real-time game updates (5-second polling)
- Random ship placement
- Game state persistence
- High scores tracking
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd battleship
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/battleship
```

4. Start the development server:

```bash
# Start the backend server
npm run server

# In a new terminal, start the frontend development server
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Game Rules

1. Each player has a 10x10 grid where they can see their ships
2. Ships are placed randomly at the start of each game
3. Players take turns firing at their opponent's grid
4. The first player to sink all of their opponent's ships wins

## Ships

- Carrier (5 spaces)
- Battleship (4 spaces)
- Cruiser (3 spaces)
- Submarine (3 spaces)
- Destroyer (2 spaces)

## API Endpoints

### User Routes

- POST /api/user/register - Register a new user
- POST /api/user/login - Login user
- POST /api/user/logout - Logout user
- GET /api/user/isLoggedIn - Check login status
- GET /api/user/scores - Get all user scores

### Game Routes

- POST /api/games/create - Create a new game
- POST /api/games/:id/join - Join an existing game
- GET /api/games - Get all games
- GET /api/games/:id - Get specific game
- POST /api/games/:id/move - Make a move in a game

## Technologies Used

- Frontend:

  - React
  - React Router
  - Axios
  - TailwindCSS
  - Vite

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - Cookie Parser

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
