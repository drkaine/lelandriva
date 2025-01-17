import path from "path";
import { save } from "./FileManager";

export class DdragonAPI {
  private url: string = "https://ddragon.leagueoflegends.com/cdn/";
  private version: string = "";

  public async access(target: string, version: boolean) {
    const response = await fetch(
      this.url + (version ? this.version + "/" : "") + target,
    );

    return response;
  }

  public async lastVersion() {
    const response = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
    const data = await response.json();
    const folderTarget = "frontend/src/assets/files/";
    this.version = data[0];
    save(
      JSON.stringify(data[0]),
      path.join(__dirname, "../../" + folderTarget + "lastVersion.json"),
    );
  }

  public async loadJson(target: string, version: boolean = true) {
    const response = await this.access(target, version);

    const data = await response.json();

    return data;
  }
  // https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/StatModsAdaptiveForceIcon.png
  // StatModsAdaptiveForceScalingIcon
  // StatModsArmorIcon
  // StatModsAttackSpeedIcon
  // StatModsCDRScalingIcon
  // StatModsHealthPlusIcon
  // StatModsHealthPlusIcon
  // StatModsHealthScalingIcon
  // StatModsMagicResIcon
  // StatModsMovementSpeedIcon
  // StatModsTenacityIcon

  public async loadImage(
    target: string,
    version: boolean = true,
  ): Promise<Buffer> {
    const response = await this.access(target, version);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
