export interface User {
  name: string;
  email: string;
  created: number;
}

export type ViewState = 
  | 'home' 
  | 'dashboard' 
  | 'bgremover' 
  | 'camera' 
  | 'three' 
  | 'house' 
  | 'assistant' 
  | 'logo' 
  | 'baby' 
  | 'builder';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface ToolDef {
  id: ViewState;
  icon: string;
  label: string;
  desc: string;
  color: string;
}