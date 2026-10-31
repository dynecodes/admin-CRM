export type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'terms';

export interface FieldSettings {
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  hidden?: boolean;
  content?: string;
  size?: 'h1' | 'h2' | 'h3';
  format?: string[];
  linkText?: string;
  linkUrl?: string;
  text?: string;
  allowOther?: boolean;
  errorMessage?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  required: boolean;
  options?: string[];
  settings: FieldSettings;
}

export interface FormStyle {
  backgroundColor: string;
  borderColor: string;
  labelColor: string;
  labelFont: string;
  textColor: string;
  textFont: string;
  headingColor: string;
  headingFont: string;
  buttonColor: string;
  buttonTextColor: string;
  customCSS: string;
}

export interface Form {
  id: number;
  name: string;
  description: string;
  fields: FormField[];
  settings: FormStyle;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at?: string;
}