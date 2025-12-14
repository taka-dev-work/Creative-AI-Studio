import React, { useState } from 'react';
import { PostType, ColorMood, Style, TextProperties, ExportFormat, BrandPreset } from '../types';
import { FONT_FACES } from '../constants';
import { DownloadIcon, ImageIcon, WandIcon, SaveIcon } from './icons';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  postType: PostType;
  setPostType: (type: PostType) => void;
  colorMood: ColorMood;
  setColorMood: (mood: ColorMood) => void;
  style: Style;
  setStyle: (style: Style) => void;
  textProps: TextProperties;
  onTextPropsChange: (updater: (prev: TextProperties) => TextProperties) => void;
  onGenerate: () => void;
  onExport: (format: ExportFormat, withText: boolean) => void;
  isLoading: boolean;
  brandPresets: BrandPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: BrandPreset) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt, setPrompt,
  postType, setPostType,
  colorMood, setColorMood,
  style, setStyle,
  textProps, onTextPropsChange,
  onGenerate, onExport, isLoading,
  brandPresets, onSavePreset, onApplyPreset,
}) => {
    const [presetName, setPresetName] = useState('');
    const [showPresetModal, setShowPresetModal] = useState(false);

    const handleSavePresetClick = () => {
        if (presetName.trim()) {
            onSavePreset(presetName.trim());
            setPresetName('');
            setShowPresetModal(false);
        }
    };

    const inputBaseClasses = "mt-1 w-full p-2 bg-gray-900/50 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all";
  
    return (
        <div className="w-full h-full bg-gray-800 text-white p-6 overflow-y-auto flex flex-col space-y-6">
            <h2 className="text-3xl font-bold text-gradient">Creative AI Studio</h2>
            
            <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-gray-200">1. Image & Caption Prompt</h3>
                <textarea
                    className={`${inputBaseClasses} h-28`}
                    placeholder="e.g., A futuristic cityscape at sunset"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>
            
            <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-gray-200">2. Style Configuration</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Post Type</label>
                        <select value={postType} onChange={(e) => setPostType(e.target.value as PostType)} className={inputBaseClasses}>
                            {Object.values(PostType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Color Mood</label>
                        <select value={colorMood} onChange={(e) => setColorMood(e.target.value as ColorMood)} className={inputBaseClasses}>
                            {Object.values(ColorMood).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400">Art Style</label>
                        <select value={style} onChange={(e) => setStyle(e.target.value as Style)} className={inputBaseClasses}>
                            {Object.values(Style).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-gray-200">3. Text Customization</h3>
                <textarea
                    className={`${inputBaseClasses} h-24`}
                    placeholder="Generated caption will appear here..."
                    value={textProps.content}
                    onChange={(e) => onTextPropsChange(prev => ({ ...prev, content: e.target.value }))}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Font Size</label>
                        <input type="number" value={textProps.fontSize} onChange={e => onTextPropsChange(prev => ({ ...prev, fontSize: parseInt(e.target.value, 10) || 0 }))} className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Font Color</label>
                        <input type="color" value={textProps.color} onChange={e => onTextPropsChange(prev => ({ ...prev, color: e.target.value }))} className={`${inputBaseClasses} h-10 p-1 cursor-pointer`} />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-400">Font Family</label>
                     <select value={textProps.fontFamily} onChange={e => onTextPropsChange(prev => ({ ...prev, fontFamily: e.target.value }))} className={inputBaseClasses}>
                            {FONT_FACES.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                     </select>
                </div>
            </div>

             <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-gray-200">Brand Presets</h3>
                <div className="flex gap-2">
                    <select onChange={(e) => { if(e.target.value) onApplyPreset(JSON.parse(e.target.value))}} className={`${inputBaseClasses} flex-grow`}>
                        <option value="">Load a preset...</option>
                        {brandPresets.map(p => <option key={p.id} value={JSON.stringify(p)}>{p.name}</option>)}
                    </select>
                    <button onClick={() => setShowPresetModal(true)} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors" aria-label="Save current style as preset">
                       <SaveIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {showPresetModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
                        <h4 className="text-lg font-semibold mb-4">Save New Preset</h4>
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Preset Name"
                            className={`${inputBaseClasses} mb-4`}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowPresetModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">Cancel</button>
                            <button onClick={handleSavePresetClick} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">Save</button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex-grow"></div>

            <div className="space-y-3 pt-4 border-t border-gray-700">
                 <button 
                    onClick={onGenerate} 
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <WandIcon className="w-6 h-6"/>
                    Generate
                </button>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onExport(ExportFormat.PNG, true)} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600/50 border border-gray-500 rounded-lg hover:bg-gray-600/80 transition-colors">
                        <DownloadIcon className="w-5 h-5"/>
                        Save PNG
                    </button>
                     <button onClick={() => onExport(ExportFormat.JPEG, true)} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600/50 border border-gray-500 rounded-lg hover:bg-gray-600/80 transition-colors">
                        <DownloadIcon className="w-5 h-5"/>
                        Save JPG
                    </button>
                </div>
                 <button onClick={() => onExport(ExportFormat.JPEG, false)} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600/50 border border-gray-500 rounded-lg hover:bg-gray-600/80 transition-colors">
                    <ImageIcon className="w-5 h-5"/>
                    Background Only
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;