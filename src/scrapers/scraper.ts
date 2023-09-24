import {
  Agencies,
  Houses,
  ScrapOptions,
  SearchOptions,
} from "../models/scraper.model";
import merge from "lodash.merge";

export abstract class Scraper {
  constructor(
    protected agencyName: string,
    protected website: string,
    protected scrapPagesOptions: ScrapOptions[]
  ) {}

  public async run(): Promise<Agencies> {
    const zoneHousesPromises = this.scrapPagesOptions.map((scrapOption) =>
      this.scrapPage(scrapOption).then((houses) => ({
        [scrapOption.zone]: houses,
      }))
    );

    const zoneHouses = await Promise.all(zoneHousesPromises);

    const zoneHousesMerged = merge({}, ...zoneHouses);

    return {
      [this.agencyName]: {
        ...zoneHousesMerged,
      },
    };
  }

  protected mergeUrlAndQueryParams(
    url: string,
    queryParams: Record<string, string>
  ): string {
    const searchParams = new URLSearchParams(queryParams).toString();
    return `${url}?${searchParams}`;
  }

  protected abstract scrapPage(searchOptions: SearchOptions): Promise<Houses>;

  protected abstract buildSearchUrl(searchOptions: SearchOptions): string;
}
