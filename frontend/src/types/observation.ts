export type Observation = {
  id: string;
  title: string;
  observed_at: string;
  band: string;
  wavelength_min_um: number;
  wavelength_max_um: number;
  ra: number;
  dec: number;
  source_url: string;
  collection: string;
  calib_level: number;
};

export type QueryInfo = {
  ra: number;
  dec: number;
  radius: number;
  collection: string;
};

export type ProvenanceInfo = {
  archive: string;
  retrieved_at: string;
};

export type ObservationListResponse = {
  items: Observation[];
  page: number;
  page_size: number;
  has_more: boolean;
  query: QueryInfo;
  provenance: ProvenanceInfo;
};
