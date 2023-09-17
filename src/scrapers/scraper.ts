import { ZoneHouses } from "../models/house.model";

export abstract class Scraper {
  abstract run(): Promise<ZoneHouses[]>;
}
