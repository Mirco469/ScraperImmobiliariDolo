import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import { Houses, SearchOptions } from "../scraper.model";

export class OrangeImmobiliareScraper extends Scraper {
  searchUrl = "cerca-immobile_C.asp";

  constructor() {
    super("OrangeImmobiliare", "http://www.orangeimmobiliare.it");
  }

  private getQueryParams(searchOptions: SearchOptions) {
    return {
      idComune: "",
      Comune: searchOptions.zone,
      VenditaAffitto: "Vendita",
      comuneName: "",
      PrezzoDa: 0,
      PrezzoA: 99999999999999,
      MQDa: 0,
      MQA: 99999999999999999,
      idTipologia: 0,
      BoxGarage: "No",
      Giardino: "No",
      Terrazza: "No",
      Servizi: 99,
      m: "ci",
      ricerca: "ricerca",
    };
  }

  private async getZoneHouses(zone: string): Promise<Houses> {
    const queryParams = this.getQueryParams({
      zone,
    });
    const response = await axios.get(`${this.website}/${this.searchUrl}`, {
      params: queryParams,
    });

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

  public async run() {
    const zones = ["Dolo", "Pianiga"];

    const zoneHousesPromises = zones.map((zone) =>
      this.getZoneHouses(zone).then((houses) => ({ [zone]: houses }))
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
