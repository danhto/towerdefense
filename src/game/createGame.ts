import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HomeScene } from "./scenes/HomeScene";

export function createGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0b3d3a",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 960,
    },
    scene: [BootScene, HomeScene],
    banner: false,
  });
}
