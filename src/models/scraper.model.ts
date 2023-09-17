export type House = {
  title: string;
  url: string;
  id: string;
};

export type ZoneHouses = {
  zone: string;
  houses: House[];
};

export type AgencyHouses = {
  agency: string;
  zones: ZoneHouses[];
};
