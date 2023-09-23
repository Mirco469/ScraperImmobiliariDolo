import { Scraper } from "../scraper";
import puppeteer, { Browser, Page } from "puppeteer";
import { Houses, SearchOptions } from "../scraper.model";

export class StyleImmobiliareScraper extends Scraper {
  browser!: Browser;

  constructor() {
    super("StyleImmobiliare", "https://styleimmobiliare.com");
  }

  private getSearchUrl(searchOptions: SearchOptions) {
    searchOptions.page ??= 1;
    let cityCode: string = "";
    switch (searchOptions.zone) {
      case "Dolo":
        cityCode = "3486";
        break;
      case "Pianiga":
        cityCode = "3502";
        break;
    }

    return `https://styleimmobiliare.com/it/vendite/?cit=${cityCode}&p=${searchOptions.page}`;
  }

  private async getZoneHouses(searchOptions: SearchOptions): Promise<Houses> {
    try {
      const URL = this.getSearchUrl(searchOptions);

      // Launch the headless browser
      const page = await this.browser.newPage();
      // Go to the webpage
      await page.goto(URL);

      await page.waitForSelector(".annuncio");

      let houses = await page.evaluate((website: string) => {
        const housesNode = document.querySelectorAll(".annuncio");

        const houses: Houses = {};
        housesNode.forEach((houseNode) => {
          const title = houseNode!.querySelector("h2 a")!.textContent!;
          const url = houseNode!.querySelector("h2 a")!.getAttribute("href")!;
          const splitUrl = url.split("/");
          const id = `${splitUrl[splitUrl.length - 3]}/${
            splitUrl[splitUrl.length - 2]
          }`;

          houses[id] = {
            title,
            url: `${website}${url}`,
          };

          return houses;
        });

        return houses;
      }, this.website);

      const hasNextPage = await this.hasNextPage(page);
      if (hasNextPage) {
        const nextPageHouses = await this.getZoneHouses({
          zone: searchOptions.zone,
          page: searchOptions.page ? ++searchOptions.page : 2,
        });

        houses = {
          ...houses,
          ...nextPageHouses,
        };
      }

      return houses;
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  private async hasNextPage(page: Page): Promise<boolean> {
    const hasNextPage = await page.evaluate(() => {
      const hasNextPageNode = document
        .querySelector(".pagination")
        ?.querySelector(".icon14-arrow-right4");

      return !!hasNextPageNode;
    });

    return hasNextPage;
  }

  public async run() {
    this.browser = await puppeteer.launch({ headless: "new" });

    const zones = ["Dolo", "Pianiga"];

    const zoneHousesPromises = zones.map((zone) =>
      this.getZoneHouses({ zone }).then((houses) => ({
        [zone]: houses,
      }))
    );

    const zoneHouses = await Promise.all(zoneHousesPromises);

    const zoneHousesMerged = Object.assign({}, ...zoneHouses);

    await this.browser.close();

    return {
      [this.agencyName]: {
        ...zoneHousesMerged,
      },
    };
  }
}
