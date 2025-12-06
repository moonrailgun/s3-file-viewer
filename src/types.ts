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
  creation_date?: string;
};

export type BucketDetails = {
  // Versioning
  versioning_enabled: boolean;
  versioning_status?: string;

  // Encryption
  encryption_enabled: boolean;
  encryption_type?: string;

  // Public access block
  block_public_acls?: boolean;
  ignore_public_acls?: boolean;
  block_public_policy?: boolean;
  restrict_public_buckets?: boolean;

  // Lifecycle rules
  lifecycle_rules_count: number;

  // Tags
  tags_count: number;

  // CORS
  cors_enabled: boolean;

  // Logging
  logging_enabled: boolean;
  logging_target_bucket?: string;
};

export type SearchMode = 'fuzzy' | 'regex';

export type Favorite = {
  id: string;
  name: string;
  connectionId: string;
  bucket: string;
  prefix: string;
  createdAt: string;
};
