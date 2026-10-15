export interface UrlItem {
  id: string;
  short_code: string;
  short_url: string;
  long_url: string;
  click_count: number;
  created_at: string;
  expire_at: string | null;
  updated_at: string;
  user_id?: string;
}

export interface ClickSourceData {
  referrers: SourceItem[];
  countries: SourceItem[];
  devices: SourceItem[];
  browsers: SourceItem[];
}

export interface SourceItem {
  name: string;
  count: number;
}
