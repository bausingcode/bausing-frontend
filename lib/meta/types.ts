export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "Contact"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type MetaContentItem = {
  id: string;
  quantity: number;
  item_price?: number;
};

export type MetaCustomData = {
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  content_type?: string;
  contents?: MetaContentItem[];
  currency?: string;
  value?: number;
  num_items?: number;
  search_string?: string;
  order_id?: string;
};

export type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  external_id?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
};

export type MetaCapiRequestBody = {
  event_name: MetaStandardEvent;
  event_id: string;
  event_source_url?: string;
  event_time?: number;
  custom_data?: MetaCustomData;
  user_data?: MetaUserDataInput;
};
