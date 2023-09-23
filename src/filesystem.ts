import { Agencies } from "./models/scraper.model";
import fs from "fs";

export class AgenciesFileSystem {
  constructor(private fileName: string) {}

  load(): Agencies {
    try {
      const file = fs.readFileSync(`${this.fileName}.json`, "utf8");
      return JSON.parse(file);
    } catch (err) {
      return {};
    }
  }

  save(data: Agencies) {
    fs.writeFileSync(`${this.fileName}.json`, JSON.stringify(data, null, 4));
  }
}
