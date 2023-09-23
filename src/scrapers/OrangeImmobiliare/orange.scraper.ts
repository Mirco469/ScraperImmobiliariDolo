import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  Houses,
  ScrapOptions,
  SearchOptions,
} from "../../models/scraper.model";

export class OrangeImmobiliareScraper extends Scraper {
  constructor() {
    const scrapPagesOptions: ScrapOptions[] = [
      { zone: "Dolo" },
      { zone: "Pianiga" },
    ];
    super(
      "OrangeImmobiliare",
      "http://www.orangeimmobiliare.it",
      scrapPagesOptions
    );
  }

  buildSearchUrl(searchOptions: SearchOptions): string {
    const queryParams = {
      idComune: "",
      Comune: searchOptions.zone,
      VenditaAffitto: "Vendita",
      comuneName: "",
      PrezzoDa: "0",
      PrezzoA: "99999999999999",
      MQDa: "0",
      MQA: "99999999999999999",
      idTipologia: "0",
      BoxGarage: "No",
      Giardino: "No",
      Terrazza: "No",
      Servizi: "99",
      m: "ci",
      ricerca: "ricerca",
    };

    return this.mergeUrlAndQueryParams(
      `${this.website}/cerca-immobile_C.asp`,
      queryParams
    );
  }

  async scrapPage(searchOptions: SearchOptions): Promise<Houses> {
    const searchUrl = this.buildSearchUrl(searchOptions);
    const response = await axios.get(searchUrl);

    const $ = cheerio.load(response.data);

    const housesHtml = $(".Titolo11Bianco");

    const houses: Houses = {};
    housesHtml.each((index, house) => {
      const title = $(house).find("a").text();
      const pageUrl: string = $(house).find("a").attr("href")!;
      const parsedUrl = new URL(pageUrl, this.website);
      const id = parsedUrl.searchParams.get("idUnita")!;

      houses[id] = {
        title,
        url: `${this.website}/${pageUrl}`,
      };
    });

    return houses;
  }
}
