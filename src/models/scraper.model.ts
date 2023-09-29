export type Houses = Record<string, House>;

export type House = {
  title: string;
  url: string;
  found?: Date;
};

export type Zones = Record<string, Houses>;

export type Agencies = Record<string, Zones>;

export type ScrapOptions = {
  zone: string;
  category?: string;
  freeTextSearch?: string[]; // Search a particular string in page (when no filter is available)
};

export type SearchOptions = ScrapOptions & {
  page?: number;
};
