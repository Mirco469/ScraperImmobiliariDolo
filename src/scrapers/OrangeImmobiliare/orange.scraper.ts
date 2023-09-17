import { Scraper } from "../scraper";
import * as cheerio from "cheerio";
import axios from "axios";
import { SearchOptions } from "./orange.model";
import { Houses } from "../scraper.model";

export class OrangeScraper extends Scraper {
  agencyName = "OrangeImmobiliare";
  website = "http://www.orangeimmobiliare.it";
  searchUrl = "cerca-immobile_C.asp";

  private getQueryParams(searchOptions: SearchOptions) {
    return {
      idComune: "",
      Comune: searchOptions.comune,
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

  private async getZoneHouses(comune: string): Promise<Houses> {
    const queryParams = this.getQueryParams({
      comune,
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
