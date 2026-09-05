import { createGame } from "./game/createGame";

const host = document.getElementById("game-host");
if (!host) {
  throw new Error("#game-host missing");
}

createGame(host);
