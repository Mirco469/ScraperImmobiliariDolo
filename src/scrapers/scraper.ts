import { AgencyHouses } from "../models/scraper.model";

export abstract class Scraper {
  abstract run(): Promise<AgencyHouses>;
}
