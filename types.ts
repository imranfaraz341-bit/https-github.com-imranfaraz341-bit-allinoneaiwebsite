export interface User {
  name: string;
  email: string;
  created: number;
}

export type ViewState = 
  | 'home' 
  | 'dashboard' 
  | 'projects'
  | 'bgremover' 
  | 'camera' 
  | 'ai-char' 
  | 'house' 
  | 'assistant' 
  | 'baby' 
  | 'builder'
  | 'ai-logo'
  | 'ai-wall'
  | 'ai-video'
  | 'image-editor';

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

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'code';
  url?: string; // For images/videos
  content?: string; // For code
  prompt: string;
  title: string;
  createdAt: number;
}