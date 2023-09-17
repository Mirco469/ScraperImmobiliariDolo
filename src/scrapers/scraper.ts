import { Agencies } from "./scraper.model";

export abstract class Scraper {
  abstract run(): Promise<Agencies>;
}
