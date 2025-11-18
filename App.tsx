
import React, { useState, useCallback, useRef } from 'react';
import { removeSubtitlesFromImage } from './services/geminiService';
import { UploadIcon, DownloadIcon, WandIcon, ResetIcon } from './components/icons';

const Header: React.FC = () => (
  <header className="text-center p-6 border-b border-slate-700">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
      AI Subtitle Remover
    </h1>
    <p className="text-slate-400 mt-2 text-lg">Upload an image and let AI magically erase the text.</p>
  </header>
);

interface ImageViewerProps {
  title: string;
  imageUrl: string;
  onDownload?: () => void;
  isLoading?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ title, imageUrl, onDownload, isLoading = false }) => (
  <div className="bg-slate-800 rounded-lg p-4 flex flex-col items-center animate-fade-in w-full">
    <h3 className="text-lg font-semibold text-slate-300 mb-3">{title}</h3>
    <div className="relative w-full aspect-video bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center text-slate-400">
          <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="mt-2">Generating...</span>
        </div>
      ) : (
        <img src={imageUrl} alt={title} className="object-contain max-h-full max-w-full" />
      )}
    </div>
    {onDownload && (
      <button
        onClick={onDownload}
        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-900 transition-colors"
      >
        <DownloadIcon className="w-5 h-5 mr-2" />
        Download Image
      </button>
    )}
  </div>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file (PNG, JPG, etc.).");
        return;
      }
      resetState();
      setOriginalImage(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);
  
  const resetState = () => {
    setOriginalImage(null);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setIsLoading(false);
    setError(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleProcessImage = useCallback(async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setProcessedImageUrl(null);
    setError(null);

    try {
      const processedImageBase64 = await removeSubtitlesFromImage(originalImage);
      setProcessedImageUrl(`data:image/png;base64,${processedImageBase64}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);
  
  const handleDownload = () => {
    if (!processedImageUrl) return;
    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = `cleaned-${originalImage?.name || 'image.png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {!originalImageUrl && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div
              className="relative block w-full border-2 border-slate-600 border-dashed rounded-lg p-12 text-center hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors cursor-pointer bg-slate-800"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
              <span className="mt-2 block text-sm font-medium text-slate-400">
                Click to upload an image
              </span>
              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {error && (
            <div className="max-w-4xl mx-auto bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative my-4 animate-fade-in" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {originalImageUrl && (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
              <ImageViewer title="Original Image" imageUrl={originalImageUrl} />
              { isLoading || processedImageUrl ? (
                <ImageViewer 
                    title="Cleaned Image" 
                    imageUrl={processedImageUrl || ''}
                    isLoading={isLoading}
                    onDownload={processedImageUrl ? handleDownload : undefined}
                />
              ) : (
                <div className="bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center animate-fade-in w-full min-h-[300px]">
                    <WandIcon className="w-16 h-16 text-purple-400 opacity-30 mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">Ready to Remove Subtitles?</h3>
                    <p className="text-slate-400 mb-6 text-center">Click the button below to start the AI process.</p>
                     <button
                        onClick={handleProcessImage}
                        disabled={isLoading}
                        className="w-full max-w-xs inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                      >
                       <WandIcon className="w-5 h-5 mr-3" />
                        {isLoading ? 'Processing...' : 'Remove Subtitles'}
                      </button>
                </div>
              )}
            </div>
            <button
              onClick={resetState}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-colors"
            >
              <ResetIcon className="w-5 h-5 mr-2" />
              Start Over
            </button>
          </div>
        )}
      </main>
      <footer className="text-center p-4 mt-8 text-slate-500 text-sm">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
