export interface Group {
  id: string;
  created_at: string;
  name: string;
  admin_ids: string[];
  participants: string[];
}