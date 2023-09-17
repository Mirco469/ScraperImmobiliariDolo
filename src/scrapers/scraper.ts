import { Agencies } from "../models/scraper.model";

export abstract class Scraper {
  abstract run(): Promise<Agencies>;
}
