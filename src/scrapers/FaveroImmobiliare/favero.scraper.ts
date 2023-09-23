import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import { Houses, SearchOptions } from "../scraper.model";

export class FaveroImmobiliareScraper extends Scraper {
  searchUrl = "ricercaimmobili";

  constructor() {
    super("FaveroImmobiliare", "https://www.faveroimmobiliare.com/");
  }

  private getQueryParams(searchOptions: SearchOptions) {
    searchOptions.page ??= 1;
    return {
      codRif: "",
      tipologia: 0,
      superficie: 0,
      localita: searchOptions.zone,
      prezzo: 0,
      tipo: 0,
      pagina: searchOptions.page,
    };
  }

  private async getZoneHouses(searchOptions: SearchOptions): Promise<Houses> {
    const queryParams = this.getQueryParams(searchOptions);
    const response = await axios.get(`${this.website}/${this.searchUrl}`, {
      params: queryParams,
    });

    const $ = cheerio.load(response.data);

    const housesHtml = $(".aa-properties-item");

    let houses: Houses = {};
    housesHtml.each((index, house) => {
      const aboutSection = $(house).find(".aa-properties-about");
      const title = aboutSection.find("h3").eq(1).text().trim();
      const pageUrl: string = aboutSection.find("a").attr("href")!;
      const parsedUrl = pageUrl.split("/");
      const id = parsedUrl[parsedUrl.length - 1];

      houses[id] = {
        title,
        url: `${this.website}/${pageUrl}`,
      };
    });

    const hasNextPage = await this.hasNextPage($);
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
  }

  private async hasNextPage($: cheerio.CheerioAPI): Promise<boolean> {
    const paginationText = $(".aa-properties-content-bottom").text().trim();
    if (!paginationText) {
      return false;
    }
    const totalPages = paginationText.match(/\d+ di \d+/)![0].split(" di ");
    return totalPages[0] !== totalPages[1];
  }

  public async run() {
    const zones = [
      "Dolo",
      "DOLO - frazione Arino",
      "PIANIGA - frazione Cazzago",
    ];

    const zoneHousesPromises = zones.map((zone) =>
      this.getZoneHouses({ zone }).then((houses) => ({ [zone]: houses }))
    );

    const zoneHouses = await Promise.all(zoneHousesPromises);

    const zoneHousesMerged = Object.assign({}, ...zoneHouses);

    return {
      [this.agencyName]: {
        ...zoneHousesMerged,
      },
    };
  }
}
