import { NewEntity } from "./models/controller.model";
import { Agencies } from "./models/scraper.model";
import { OrangeScraper } from "./scrapers/Orange/orange.scraper";
import fs from "fs";

export class Controller {
  async run() {
    const result = await new OrangeScraper().run();
    this.checkNewEntriesAndSave(result);
  }

  checkNewEntriesAndSave(scrapedAgencyHouses: Agencies) {
    const newEntries: NewEntity[] = [];
    const savedHouses = this.load();

    for (const [agencyId, zones] of Object.entries(scrapedAgencyHouses)) {
      for (const [zoneId, houses] of Object.entries(zones)) {
        for (const [houseId, house] of Object.entries(houses)) {
          if (!savedHouses[agencyId]?.[zoneId]?.[houseId]) {
            // House not already saved
            newEntries.push({
              agency: agencyId,
              zone: zoneId,
              title: house.title,
              url: house.url,
            });
            house.found = new Date();
          }
        }
      }
    }

    console.log("New entries...");
    console.table(newEntries);

    this.save(scrapedAgencyHouses);
  }

  load(): Agencies {
    try {
      const file = fs.readFileSync("houses.json", "utf8");
      return JSON.parse(file);
    } catch (err) {
      return {};
    }
  }

  save(data: Agencies) {
    fs.writeFileSync("houses.json", JSON.stringify(data, null, 4));
  }
}
