import { PostType, AspectRatioName } from './types';

// Fix: Use AspectRatioName type for consistency.
export const ASPECT_RATIOS: { [key in PostType]: { ratio: number, name: AspectRatioName } } = {
  [PostType.FeedSquare]: { ratio: 1 / 1, name: '1:1' },
  // Fix: Use correct portrait aspect ratio '3:4' instead of landscape '4:3'.
  [PostType.FeedPortrait]: { ratio: 4 / 5, name: '3:4' }, // Note: 4:5 is not a direct option, 3:4 is portrait and supported. Will crop in canvas
  [PostType.Story]: { ratio: 9 / 16, name: '9:16' },
};

export const FONT_FACES = [
    'Inter',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Lobster',
    'Pacifico',
    'Roboto'
];

export const PREVIEW_CANVAS_MAX_WIDTH = 800;
