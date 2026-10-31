export type TagColor = 'blue' | 'yellow' | 'orange' | 'purple';

export interface Tag {
  id: number;
  tag_name: string;
  tag_color: TagColor;
  customer_count: number;
  provider_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TagFormData {
  tag_name: string;
  tag_color: TagColor;
}
