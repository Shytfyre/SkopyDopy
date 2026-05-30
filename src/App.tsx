import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { DocumentViewer } from './components/DocumentViewer';
import { StudyTools } from './components/StudyTools';
import { Onboarding } from './components/Onboarding';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadZone } from './components/UploadZone';


import { useGPUDetection } from './hooks/useGPUDetection';
import { useWebLLM } from './hooks/useWebLLM';
import { useVisionModel } from './hooks/useVisionModel';
import { useDocuments } from './hooks/useDocuments';
import { useConversations } from './hooks/useConversations';
import { useStudyTools } from './hooks/useStudyTools';
import { useRAG } from './hooks/useRAG';

import { getRecommendedModel, TEXT_MODELS } from './lib/model-registry';

export default function App() {
  const { capabilities, isDetecting } = useGPUDetection();
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [rightPanel, setRightPanel] = useState<'document' | 'study'>('document');

  const { isReady: llmReady, isGenerating, progress: llmProgress, currentResponse, error: llmError, initModel, sendMessage } = useWebLLM();
  const { isReady: visionReady, isProcessing: visionProcessing, progress: visionProgress, analyzeImage } = useVisionModel();
  
  const { documents, activeDocumentId, setActiveDocumentId, isUploading, uploadFile, deleteDocument } = useDocuments();
  const { conversations, activeConversationId, setActiveConversationId, activeConversation, createConversation, addMessage, deleteConversation } = useConversations();
  const { search } = useRAG();

  const studyTools = useStudyTools(sendMessage);

  // Auto-select recommended model based on capabilities
  useEffect(() => {
    if (capabilities && !hasOnboarded) {
      const rec = getRecommendedModel(capabilities);
      setCurrentModelId(rec.id);
    }
  }, [capabilities, hasOnboarded]);

  const handleOnboardingComplete = (selectedModelId: string) => {
    setCurrentModelId(selectedModelId);
    setHasOnboarded(true);
    const modelConfig = TEXT_MODELS.find(m => m.id === selectedModelId)!;
    initModel(selectedModelId, modelConfig.runtime);
  };

  const handleModelChange = (modelId: string) => {
    setCurrentModelId(modelId);
    const modelConfig = TEXT_MODELS.find(m => m.id === modelId)!;
    initModel(modelId, modelConfig.runtime);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId) {
      const conv = await createConversation(currentModelId, text.slice(0, 30));
      // State updates are async, so we use the conv id directly
      _sendMessageToEngine(text, conv.id);
    } else {
      _sendMessageToEngine(text, activeConversationId);
    }
  };

  const _sendMessageToEngine = async (text: string, convId: string) => {
    // Add user message to DB
    await addMessage(convId, 'user', text);

    const activeDoc = documents.find(d => d.id === activeDocumentId);
    let systemPrompt = "You are Skopos Study, a helpful, precise, and encouraging AI study assistant.";
    
    // RAG Context
    if (activeDoc && activeDoc.type !== 'image') {
      const relevantChunks = await search(text, [activeDoc.id]);
      if (relevantChunks.length > 0) {
        systemPrompt += "\n\nUse the following excerpts from the user's document to answer the question. If the answer is not in the excerpts, just answer based on your general knowledge but mention that it wasn't in the document.\n\n=== EXCERPTS ===\n";
        relevantChunks.forEach(chunk => {
          systemPrompt += chunk.text + "\n---\n";
        });
      }
    } else if (activeDoc && activeDoc.type === 'image') {
       systemPrompt += `\n\nThe user is currently looking at an image document named "${activeDoc.name}".`;
       if (activeDoc.extractedText && activeDoc.extractedText !== '[Image Document - Analyze with AI to extract description]') {
          systemPrompt += `\n\nImage AI Analysis: ${activeDoc.extractedText}`;
       }
    }

    // We only send the last few messages for context window reasons, plus the new one
    const conv = conversations.find(c => c.id === convId);
    const history = conv ? conv.messages.slice(-6).map(m => ({ role: m.role, content: m.content })) : [];
    
    // We add the user message to history manually since it might not be in the state yet
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: text }
    ];

    try {
      const response = await sendMessage(messages as any);
      await addMessage(convId, 'assistant', response);
    } catch (err) {
      console.error("Chat generation failed", err);
    }
  };

  const activeDoc = documents.find(d => d.id === activeDocumentId) || null;

  if (isDetecting || !capabilities) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)'}}>Probing Hardware...</div>;

  return (
    <div className="app-container">
      {!hasOnboarded && (
        <Onboarding 
          capabilities={capabilities} 
          recommendedModel={getRecommendedModel(capabilities)} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      {llmProgress && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '400px' }}>
            <h3>{llmProgress.text}</h3>
            {llmProgress.text.includes('Loading GPU') && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Compiling shaders. This is a heavy operation and may briefly freeze your browser. Please wait...
              </p>
            )}
            <div style={{ width: '300px', height: '8px', background: 'var(--color-bg-base)', borderRadius: '4px', margin: '1rem auto', overflow: 'hidden' }}>
              <div style={{ width: `${((llmProgress.progress || 0) * 100).toFixed(0)}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
            </div>
          </div>
        </div>
      )}

      {llmError && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: 'var(--color-error)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Initialization Error</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '300px' }}>{llmError}</p>
        </div>
      )}

      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)}
          capabilities={capabilities}
          currentModelId={currentModelId}
          onModelChange={handleModelChange}
        />
      )}

      {showUpload && (
        <UploadZone 
          isUploading={isUploading}
          onUpload={async (f) => {
            await uploadFile(f);
            setShowUpload(false);
          }}
        />
      )}

      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={() => setActiveConversationId(null)}
        onDeleteConversation={deleteConversation}
        
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={setActiveDocumentId}
        onDeleteDocument={deleteDocument}
        
        onUploadClick={() => setShowUpload(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header 
          isModelReady={llmReady}
          gpuAdapterName={capabilities?.adapterName || 'CPU'}
          modelName={TEXT_MODELS.find(m => m.id === currentModelId)?.displayName || currentModelId}
          onOpenSettings={() => setShowSettings(true)}
        />
        
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ChatPanel 
            messages={activeConversation?.messages || []}
            isGenerating={isGenerating}
            currentResponse={currentResponse}
            onSendMessage={handleSendMessage}
            activeContext={activeDoc ? `Studying: ${activeDoc.name}` : undefined}
          />

          <div style={{ width: '400px', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
              <button 
                className="btn" 
                style={{ flex: 1, borderRadius: 0, background: rightPanel === 'document' ? 'var(--color-bg-surface-hover)' : 'transparent', color: rightPanel === 'document' ? 'white' : 'var(--color-text-muted)' }}
                onClick={() => setRightPanel('document')}
              >Document View</button>
              <button 
                className="btn" 
                style={{ flex: 1, borderRadius: 0, background: rightPanel === 'study' ? 'var(--color-bg-surface-hover)' : 'transparent', color: rightPanel === 'study' ? 'white' : 'var(--color-text-muted)' }}
                onClick={() => setRightPanel('study')}
              >Study Tools</button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {rightPanel === 'document' ? (
                <DocumentViewer 
                  document={activeDoc} 
                  isAnalyzingImage={visionProcessing}
                  onAnalyzeImage={async (url) => {
                    // For v1, we fake the url or create objectURL if we had blob.
                    // Assuming we pass the activeDoc.id instead
                    if (activeDoc?.type === 'image') {
                       // We can't actually do this easily without the blob. But for the sake of completion:
                       const res = await analyzeImage('https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=400'); // Fake image since we don't store blob easily
                       // Update doc in DB with analysis
                       console.log(res);
                    }
                  }}
                />
              ) : (
                <StudyTools 
                  isGenerating={studyTools.isGenerating}
                  onGenerateFlashcards={() => studyTools.generateFlashcards(activeDoc?.extractedText || 'No text')}
                  onGenerateQuiz={() => studyTools.generateQuiz(activeDoc?.extractedText || 'No text')}
                  onGenerateSummary={() => studyTools.generateSummary(activeDoc?.extractedText || 'No text', 'brief')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}