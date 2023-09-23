import { Agencies } from "./scraper.model";

export abstract class Scraper {
  constructor(protected agencyName: string, protected website: string) {}

  abstract run(): Promise<Agencies>;
}
