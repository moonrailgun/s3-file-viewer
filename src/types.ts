// Shared app types

export type SshTunnelConfig = {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  auth_method: 'password' | 'key';
  password?: string;
  private_key_path?: string;
  private_key_passphrase?: string;
  local_port?: number; // Auto-assigned if not specified
  remote_host: string; // Usually localhost or internal IP
  remote_port: number; // Minio port, usually 9000
};

export type ConnectionParams = {
  endpoint: string;
  access_key: string;
  secret_key: string;
  region: string;
  ssh_tunnel?: SshTunnelConfig;
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
