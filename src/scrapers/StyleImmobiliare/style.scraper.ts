import { Scraper } from "../scraper";
import puppeteer, { Browser, Page } from "puppeteer";
import {
  Houses,
  ScrapOptions,
  SearchOptions,
} from "../../models/scraper.model";

export class StyleImmobiliareScraper extends Scraper {
  browser!: Browser;

  constructor() {
    const scrapPagesOptions: ScrapOptions[] = [
      { zone: "Dolo" },
      { zone: "Pianiga" },
    ];
    super(
      "StyleImmobiliare",
      "https://styleimmobiliare.com",
      scrapPagesOptions
    );
  }

  async run() {
    this.browser = await puppeteer.launch({ headless: "new" });
    const result = await super.run();
    await this.browser.close();
    return result;
  }

  buildSearchUrl(searchOptions: SearchOptions) {
    let cityCode: string = "";
    switch (searchOptions.zone) {
      case "Dolo":
        cityCode = "3486";
        break;
      case "Pianiga":
        cityCode = "3502";
        break;
    }

    const queryParams = {
      cit: cityCode,
      p: (searchOptions.page ?? 1).toString(),
    };

    return this.mergeUrlAndQueryParams(
      `${this.website}/it/vendite`,
      queryParams
    );
  }

  async scrapPage(searchOptions: SearchOptions): Promise<Houses> {
    try {
      const searchUrl = this.buildSearchUrl(searchOptions);

      // Launch the headless browser
      const page = await this.browser.newPage();
      // Go to the webpage
      await page.goto(searchUrl);

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
        const nextPageHouses = await this.scrapPage({
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
}
