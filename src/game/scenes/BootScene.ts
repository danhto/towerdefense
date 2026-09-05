import Phaser from "phaser";
import { trackSessionStart } from "../meta/analytics";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0b3d3a");
    trackSessionStart();
    this.scene.start("home");
  }
}
