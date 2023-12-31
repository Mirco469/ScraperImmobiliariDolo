import { NewEntity } from "./models/controller.model";
import { Agencies } from "./models/scraper.model";
import { OrangeImmobiliareScraper } from "./scrapers/OrangeImmobiliare/orange.scraper";
import { StyleImmobiliareScraper } from "./scrapers/StyleImmobiliare/style.scraper";
import { FaveroImmobiliareScraper } from "./scrapers/FaveroImmobiliare/favero.scraper";
import { AgenciesFileSystem } from "./filesystem";
import { AsteAnnunciScraper } from "./scrapers/AsteaAnnunci/asteannunci.scraper";
import { EmmeEnneScraper } from "./scrapers/EmmeEnne/emmeenne.scraper";

export class Controller {
  filesystem: AgenciesFileSystem;

  constructor() {
    this.filesystem = new AgenciesFileSystem("houses");
  }

  async run() {
    const scrapersPromises = [
      new OrangeImmobiliareScraper(),
      new StyleImmobiliareScraper(),
      new FaveroImmobiliareScraper(),
      new AsteAnnunciScraper(),
      new EmmeEnneScraper(),
    ].map((scraper) => scraper.run());
    const scrapersResults = await Promise.all(scrapersPromises);
    const scraperMergedResults = Object.assign({}, ...scrapersResults);

    this.checkNewEntriesAndSave(scraperMergedResults);
  }

  checkNewEntriesAndSave(scrapedAgencyHouses: Agencies) {
    const newEntries: NewEntity[] = [];
    const savedHouses = this.filesystem.load();

    for (const [agencyId, zones] of Object.entries(scrapedAgencyHouses)) {
      for (const [zoneId, houses] of Object.entries(zones)) {
        // If length === 0 the could be a problem with the scraper
        if (Object.entries(houses).length === 0) {
          console.warn(
            "\x1b[33m%s\x1b[0m",
            `Warning: zero houses for agency ${agencyId} in zone ${zoneId}`
          );
        }
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
          } else {
            house.found = savedHouses[agencyId][zoneId][houseId].found;
          }
        }
      }
    }

    console.log("Looking for new entries...");
    newEntries.length > 0
      ? console.table(newEntries)
      : console.log("###  No new entires found  ###");

    this.filesystem.save(scrapedAgencyHouses);
  }
}
