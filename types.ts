export enum PostType {
  FeedSquare = 'Feed (Square 1:1)',
  FeedPortrait = 'Feed (Portrait 4:5)',
  Story = 'Story (9:16)',
}

export enum ColorMood {
  Vibrant = 'Vibrant',
  Pastel = 'Pastel',
  Monochrome = 'Monochrome',
  Earthy = 'Earthy',
  Neon = 'Neon',
}

export enum Style {
  Photorealistic = 'Photorealistic',
  Minimalist = 'Minimalist',
  Fantasy = 'Fantasy',
  Abstract = 'Abstract',
  Vintage = 'Vintage',
}

export enum ExportFormat {
    PNG = 'image/png',
    JPEG = 'image/jpeg'
}

// Fix: Add and export AspectRatioName type to resolve import error.
export type AspectRatioName = '1:1' | '4:3' | '16:9' | '9:16' | '3:4';

export interface TextProperties {
    content: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
    box: { x: number; y: number, width: number, height: number } | null;
}

export interface BrandPreset {
    id: string;
    name: string;
    color: string;
    fontFamily: string;
}
