import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import { Houses, ScrapOptions, SearchOptions } from "../scraper.model";

export class FaveroImmobiliareScraper extends Scraper {
  searchUrl = "ricercaimmobili";

  constructor() {
    const scrapPagesOptions: ScrapOptions[] = [
      { zone: "DOLO" },
      { zone: "DOLO - frazione Arino" },
      { zone: "PIANIGA - frazione Cazzago" },
    ];
    super(
      "FaveroImmobiliare",
      "https://www.faveroimmobiliare.com/",
      scrapPagesOptions
    );
  }

  buildSearchUrl(searchOptions: SearchOptions) {
    const queryParams = {
      codRif: "",
      tipologia: "0",
      superficie: "0",
      localita: searchOptions.zone,
      prezzo: "0",
      tipo: "0",
      pagina: (searchOptions.page ?? 1).toString(),
    };

    return this.mergeUrlAndQueryParams(
      `${this.website}/ricercaimmobili`,
      queryParams
    );
  }

  async scrapPage(searchOptions: SearchOptions): Promise<Houses> {
    const searchUrl = this.buildSearchUrl(searchOptions);
    console.log(searchUrl);
    const response = await axios.get(searchUrl);

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
  }

  private async hasNextPage($: cheerio.CheerioAPI): Promise<boolean> {
    const paginationText = $(".aa-properties-content-bottom").text().trim();
    if (!paginationText) {
      return false;
    }
    const totalPages = paginationText.match(/\d+ di \d+/)![0].split(" di ");
    return totalPages[0] !== totalPages[1];
  }
}
