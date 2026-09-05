import { createGame } from "./game/createGame";
import { installGlobalErrorHandlers } from "./game/meta/errors";

installGlobalErrorHandlers();

const host = document.getElementById("game-host");
if (!host) {
  throw new Error("#game-host missing");
}

createGame(host);
