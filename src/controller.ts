import { AgencyHouses } from "./models/scraper.model";
import { OrangeScraper } from "./scrapers/Orange/orange.scraper";
import fs from "fs";

export class Controller {
  async run() {
    const result = await new OrangeScraper().run();
    this.save([result]);
  }

  save(data: AgencyHouses[]) {
    fs.writeFileSync("houses.json", JSON.stringify(data, null, 4));
  }
}
