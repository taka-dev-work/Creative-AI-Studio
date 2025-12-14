import React, { useState, useCallback, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewCanvas from './components/PreviewCanvas';
import { PostType, ColorMood, Style, TextProperties, ExportFormat, BrandPreset } from './types';
import { generateImage, analyzeRequest } from './services/gemini';
import { ASPECT_RATIOS } from './constants';

const App: React.FC = () => {
    // App State
    const [prompt, setPrompt] = useState<string>('');
    const [postType, setPostType] = useState<PostType>(PostType.FeedSquare);
    const [colorMood, setColorMood] = useState<ColorMood>(ColorMood.Vibrant);
    const [style, setStyle] = useState<Style>(Style.Photorealistic);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [brandPresets, setBrandPresets] = useState<BrandPreset[]>([]);
    const [captionPlacement, setCaptionPlacement] = useState<'top' | 'middle' | 'bottom' | null>(null);

    const [panelWidth, setPanelWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

    const [textProps, setTextProps] = useState<TextProperties>({
        content: '',
        position: { x: 100, y: 100 },
        fontSize: 48,
        color: '#FFFFFF',
        fontFamily: 'Inter',
        textAlign: 'center',
        box: null,
    });
    
    useEffect(() => {
        try {
            const storedPresets = localStorage.getItem('brandPresets');
            if (storedPresets) {
                setBrandPresets(JSON.parse(storedPresets));
            }
        } catch (error) {
            console.error("Failed to load presets from localStorage", error);
        }
    }, []);

    const handleTextPropsChange = (updater: (prev: TextProperties) => TextProperties) => {
        setTextProps(updater);
        if (captionPlacement) {
            setCaptionPlacement(null);
        }
    };

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setCaptionPlacement(null);
        try {
            const { name } = ASPECT_RATIOS[postType];
            
            // Step 1: Analyze
            // Pass the current textProps.content so the AI knows to preserve it if it exists
            const analysis = await analyzeRequest(prompt, postType, colorMood, style, textProps.content);
            
            setTextProps(prev => ({
                ...prev,
                content: analysis.caption,
            }));
            setCaptionPlacement(analysis.position);

            // Step 2: Generate Image
            const imageUrl = await generateImage(analysis.refinedPrompt, name);
            setGeneratedImage(imageUrl);

        } catch (error: any) {
            console.error("Generation failed:", error);
            alert("An error occurred during generation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, postType, colorMood, style, textProps.content]);

    const handleExport = useCallback((format: ExportFormat, withText: boolean) => {
        const previewCanvas = document.querySelector('canvas');
        if (!generatedImage || !previewCanvas) return;
    
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = generatedImage;
        img.onload = () => {
            const originalWidth = img.width;
            const originalHeight = img.height;
            tempCanvas.width = originalWidth;
            tempCanvas.height = originalHeight;
            
            const scaleX = originalWidth / previewCanvas.width;
            const scaleY = originalHeight / previewCanvas.height;

            tempCtx.drawImage(img, 0, 0, originalWidth, originalHeight);

            if (withText && textProps.content) {
                const scaledFontSize = textProps.fontSize * Math.min(scaleX, scaleY);
                tempCtx.font = `${scaledFontSize}px ${textProps.fontFamily}`;
                tempCtx.fillStyle = textProps.color;
                tempCtx.textAlign = textProps.textAlign;
                tempCtx.textBaseline = 'top';
                
                tempCtx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                tempCtx.shadowBlur = 15;
                tempCtx.shadowOffsetX = 3;
                tempCtx.shadowOffsetY = 3;

                const maxWidth = tempCanvas.width * 0.9;
                const lineHeight = scaledFontSize * 1.2;
                const paragraphs = textProps.content.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(p => {
                    if (p === '') { lines.push(''); return; }
                    const words = p.split(' ');
                    let currentLine = '';
                    for (const word of words) {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        if (tempCtx.measureText(testLine).width > maxWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    lines.push(currentLine);
                });

                lines.forEach((line, index) => {
                    tempCtx.fillText(
                        line, 
                        textProps.position.x * scaleX, 
                        (textProps.position.y * scaleY) + (index * lineHeight)
                    );
                });
            }

            const dataUrl = tempCanvas.toDataURL(format, format === ExportFormat.JPEG ? 0.9 : 1.0);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `creative-ai-studio-image.${format.split('/')[1]}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [generatedImage, textProps]);
    
    const handleSavePreset = (name: string) => {
        const newPreset: BrandPreset = {
            id: new Date().toISOString(),
            name,
            color: textProps.color,
            fontFamily: textProps.fontFamily,
        };
        const updatedPresets = [...brandPresets, newPreset];
        setBrandPresets(updatedPresets);
        localStorage.setItem('brandPresets', JSON.stringify(updatedPresets));
    };

    const handleApplyPreset = (preset: BrandPreset) => {
        setTextProps(prev => ({
            ...prev,
            color: preset.color,
            fontFamily: preset.fontFamily,
        }));
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 350 && newWidth < 800) {
                setPanelWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Main App
    return (
        <main className="bg-gray-900 w-screen h-screen flex overflow-hidden" style={{ cursor: isResizing ? 'col-resize' : 'auto' }}>
            <div className="flex-shrink-0 h-full" style={{ width: `${panelWidth}px` }}>
                <ControlPanel
                    prompt={prompt} setPrompt={setPrompt}
                    postType={postType} setPostType={setPostType}
                    colorMood={colorMood} setColorMood={setColorMood}
                    style={style} setStyle={setStyle}
                    textProps={textProps} onTextPropsChange={handleTextPropsChange}
                    onGenerate={handleGenerate}
                    onExport={handleExport}
                    isLoading={isLoading}
                    brandPresets={brandPresets}
                    onSavePreset={handleSavePreset}
                    onApplyPreset={handleApplyPreset}
                />
            </div>
            
            <div 
                className="w-2 h-full cursor-col-resize bg-gray-700/50 hover:bg-purple-500 transition-colors"
                onMouseDown={handleMouseDown}
            />

            <div className="flex-grow h-full">
                <PreviewCanvas
                    imageSrc={generatedImage}
                    textProps={textProps}
                    onTextPropsChange={handleTextPropsChange}
                    aspectRatio={ASPECT_RATIOS[postType].ratio}
                    isLoading={isLoading}
                    captionPlacement={captionPlacement}
                />
            </div>
        </main>
    );
};

export default App;