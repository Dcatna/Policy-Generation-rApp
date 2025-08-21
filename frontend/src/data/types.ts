export interface ServiceItem {
  service_id: string;
  keep_alive_interval_seconds: number;
  time_since_last_activity_seconds?: number;
  callback_url?: string;
}
export interface ServiceListResp {
  service_list: ServiceItem[];
}

export interface PolicyInstance {
  policy_id: string;
  policytype_id: string;
  ric_id: string;
  policy_data: any;
  service_id: string;
  transient: boolean;
  status_notification_uri: string;
}
export interface PolicyInstancesResp {
  policies: PolicyInstance[];
}

export interface RicInfo { 
    ric_id: string; 
    state?: string; 
}
