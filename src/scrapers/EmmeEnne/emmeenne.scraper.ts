import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  Houses,
  ScrapOptions,
  SearchOptions,
} from "../../models/scraper.model";

export class EmmeEnneScraper extends Scraper {
  constructor() {
    const freeTextSearch = ["Dolo", "Pianiga"];
    const scrapPagesOptions: ScrapOptions[] = [
      { zone: "", category: "ville", freeTextSearch },
      { zone: "", category: "bifamiliari", freeTextSearch },
      { zone: "", category: "terreni", freeTextSearch },
      { zone: "", category: "case-schiera", freeTextSearch },
      { zone: "", category: "terreni", freeTextSearch },
      { zone: "", category: "case-singole", freeTextSearch },
      { zone: "", category: "rustici", freeTextSearch },
    ];
    super("EmmeEnne", "http://www.emmeennedolo.it", scrapPagesOptions);
  }

  buildSearchUrl(searchOptions: SearchOptions) {
    const queryParams = {
      page: (searchOptions.page ?? 1).toString(),
    };

    return this.mergeUrlAndQueryParams(
      `${this.website}/vendita/${searchOptions.category}`,
      queryParams
    );
  }

  async scrapPage(searchOptions: SearchOptions): Promise<Houses> {
    const searchUrl = this.buildSearchUrl(searchOptions);
    const response = await axios.get(searchUrl);

    const $ = cheerio.load(response.data);

    const housesHtml = $(".listing-box-inner");

    let houses: Houses = {};
    housesHtml.each((index, house) => {
      const infoSection = $(house).find(".info-immobile");
      const searchString = infoSection
        .find(".list-inline-item")
        .eq(0)
        .text()
        .trim();

      const isRelevant = searchOptions.freeTextSearch?.some(
        (textSearch) =>
          textSearch.toLowerCase() === searchString.trim().toLowerCase()
      );
      if (!isRelevant) {
        return;
      }

      const title = $(house).find("a").children("h4").text().trim();
      // /appartamento-in-vendita-a-campagna_lupia-954
      const pageUrl: string = $(house).find("a").attr("href")!;
      const parsedUrl = pageUrl.split("-");
      const id = parsedUrl[parsedUrl.length - 1];

      houses[id] = {
        title: `${searchString} - ${title}`,
        url: `${this.website}${pageUrl}`,
      };
    });

    const hasNextPage = await this.hasNextPage($);
    if (hasNextPage) {
      const nextPageHouses = await this.scrapPage({
        ...searchOptions,
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
    const pagination = $(".pagination");
    const hasNextButton = pagination.find(".pager_link_tail").length > 0;
    return hasNextButton;
  }
}
