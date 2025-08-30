// Shared app types

export type ConnectionParams = {
  endpoint: string;
  access_key: string;
  secret_key: string;
  region: string;
};

export type SavedConnection = ConnectionParams & {
  id: string;
  name: string;
  created_at: string;
  last_used?: string;
};

export type S3ObjectInfo = {
  key: string;
  size: number;
  last_modified?: string;
  is_dir: boolean;
};

export type BucketInfo = {
  name: string;
  region: string;
};
