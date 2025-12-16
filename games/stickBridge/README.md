# Stick Bridge Game

## Overview
Stick Bridge Game is an interactive HTML5 game where players control a character (sprite) that moves across blocks by creating paths of varying lengths. The objective is to successfully transition from one block to another without falling off the edges.

## Game Rules
1. The game starts with the character on the base.
2. Players can press anywhere on the screen to define the length of the path. A shorter press results in a smaller path, while a longer press creates a longer path.
3. As the character moves to the next block, the score increases.
4. The goal is to create paths of adequate length to reach the next block.
5. Upon successful transition, the block with the character moves to the left edge of the screen.
6. The frame advances, revealing more blocks on the right.
7. When the player presses for path creation, the path is created vertically upwards.
8. Once the player stops pressing, the path rotates 90 degrees clockwise around the bottom corner.
9. After laying the path horizontally, the character moves along it.
10. If the path's end does not fall within the display width of the next block, the character dies.

## Art Assets
The following graphic assets are required for the game:
- **actor.svg**: Character sprite
- **block.svg**: Block graphic
- **base.svg**: Base graphic
- **path.svg**: Path graphic

## Getting Started
To run the game, follow these steps:
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Open `src/index.html` in a web browser to start playing.

## Dependencies
This project uses npm for package management. Ensure you have Node.js installed, then run the following command to install dependencies:
```
npm install
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.