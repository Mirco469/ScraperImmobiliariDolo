import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  Houses,
  ScrapOptions,
  SearchOptions,
} from "../../models/scraper.model";

export class AsteAnnunciScraper extends Scraper {
  constructor() {
    /**
     * A: Abitazione
     * T: Terreno
     */
    const scrapPagesOptions: ScrapOptions[] = [
      { zone: "Dolo", category: "A" },
      { zone: "Dolo", category: "T" },
      { zone: "Pianiga", category: "A" },
      { zone: "Pianiga", category: "T" },
    ];
    super("AsteAnnunci", "https://www.asteannunci.it", scrapPagesOptions);
  }

  buildSearchUrl(searchOptions: SearchOptions) {
    const queryParams = {
      tipologia_lotto: "immobiliare",
      limit: "36",
      regione: "Veneto",
      provincia: "Venezia",
      comune: searchOptions.zone,
      tipologia: searchOptions.category!,
      page: (searchOptions.page ?? 1).toString(),
    };

    return this.mergeUrlAndQueryParams(
      `${this.website}/aste/cerca`,
      queryParams
    );
  }

  async scrapPage(searchOptions: SearchOptions): Promise<Houses> {
    const searchUrl = this.buildSearchUrl(searchOptions);
    const response = await axios.get(searchUrl);

    const $ = cheerio.load(response.data);

    const housesHtml = $(".card, .vertical-card");

    let houses: Houses = {};
    housesHtml.each((index, house) => {
      const title = $(house).find(".card-title").text().trim();
      const pageUrl: string = $(house).find("a").attr("href")!;
      if (!pageUrl) {
        // Some cards are not houses
        return;
      }
      // /123/123/
      const parsedUrl = pageUrl.match(/\/\d+\/\d+\//)![0];
      // Remove first and last /
      const id = parsedUrl.substring(1, parsedUrl.length - 1);

      houses[id] = {
        title,
        url: `${this.website}${pageUrl}`,
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
    let hasNextPage = false;
    const pageItem = $(".pagination .page-item");
    pageItem.each((index, button) => {
      const buttonIcon = button.firstChild!;
      if ($(buttonIcon).attr("aria-label") === "Go to next page") {
        hasNextPage = !$(buttonIcon).attr("aria-disabled");
      }
    });
    return hasNextPage;
  }
}
