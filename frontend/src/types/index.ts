export interface UrlItem {
  id: string;
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  clickCount: number;
  createdAt: string;
  expireAt: string | null;
  updatedAt: string;
  userId?: string;
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
