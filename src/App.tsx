import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AnalysisRecord, SampleGraph } from './types';
import { analyzeChartImage } from './services/featherless';
import { speechService } from './services/speech';

export const App: React.FC = () => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('echograph_high_contrast') === 'true';
  });
  const [activeScreen, setActiveScreen] = useState<'upload' | 'results'>('upload');
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Sync high-contrast class with document root
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast', 'dark');
    } else {
      document.documentElement.classList.remove('high-contrast', 'dark');
    }
    localStorage.setItem('echograph_high_contrast', String(highContrast));
  }, [highContrast]);

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const handleAnalyze = async (
    imageDataUrl: string,
    fileName: string,
    sampleData?: SampleGraph
  ) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Pass 1/2: Extracting axes, trends & values...');

    try {
      // Multi-pass visual perception execution
      const analysisPromise = analyzeChartImage(imageDataUrl);
      
      const stepTimer = setTimeout(() => {
        setLoadingStep('Pass 2/2: Auditing description for accuracy...');
      }, 2500);

      const result = await analysisPromise;
      clearTimeout(stepTimer);

      const newRecord: AnalysisRecord = {
        id: `analysis-${Date.now()}`,
        timestamp: Date.now(),
        fileName,
        imageUrl: imageDataUrl,
        description: result.description,
        verification: result.verification,
        extractedValues: sampleData?.precomputedValues || result.extractedValues,
        modelUsed: result.modelUsed,
      };

      setCurrentRecord(newRecord);
      setHistory((prev) => [newRecord, ...prev]);
      setActiveScreen('results');

      // Auto-play spoken audio as requested for low-vision accessibility
      setTimeout(() => {
        speechService.speakDescription(newRecord.description);
      }, 300);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err?.message || 'An unexpected error occurred during visual analysis. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleNewGraph = () => {
    speechService.stop();
    setActiveScreen('upload');
    setError(null);
  };

  const handleSelectHistoryRecord = (record: AnalysisRecord) => {
    speechService.stop();
    setCurrentRecord(record);
    setActiveScreen('results');
    speechService.speakDescription(record.description);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <Header
        highContrast={highContrast}
        onToggleHighContrast={toggleHighContrast}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Body: Screen 1 (Upload) or Screen 2 (Results) */}
      {activeScreen === 'upload' || !currentRecord ? (
        <UploadScreen
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          loadingStep={loadingStep}
          error={error}
          onOpenSettings={() => setIsSettingsOpen(true)}
          highContrast={highContrast}
        />
      ) : (
        <ResultsScreen
          record={currentRecord}
          onNewGraph={handleNewGraph}
          onOpenSettings={() => setIsSettingsOpen(true)}
          highContrast={highContrast}
        />
      )}

      {/* Modals & Drawers */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        highContrast={highContrast}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearHistory}
        highContrast={highContrast}
      />
    </div>
  );
};

export default App;
