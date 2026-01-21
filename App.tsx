import React, { useState, useEffect } from 'react';
import { FlipCard } from './components/FlipCard';
import { CollectionGrid } from './components/CollectionGrid';
import { MemoryGame } from './components/MemoryGame';
import { fetchWordDefinition } from './services/dictionaryService';
import { VocabularyData, SavedCard, ViewState } from './types';

function App() {
  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<VocabularyData | null>(null);
  const [collection, setCollection] = useState<SavedCard[]>([]);
  const [view, setView] = useState<ViewState>('search');
  const [apiKeyReady, setApiKeyReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nihongo_deck');
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }
    
    // Check for API Key presence (simulated check, in reality checking env/context)
    if (process.env.API_KEY) {
      setApiKeyReady(true);
    }
  }, []);

  // Save to localStorage whenever collection changes
  useEffect(() => {
    localStorage.setItem('nihongo_deck', JSON.stringify(collection));
  }, [collection]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentCard(null);

    try {
      const data = await fetchWordDefinition(query);
      if (data) {
        setCurrentCard(data);
      } else {
        setError("Could not find a definition. Try a simpler word.");
      }
    } catch (err) {
      setError("Error connecting to the dictionary service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = () => {
    if (!currentCard) return;

    // Create a deep copy to remove audio data before saving to localStorage
    // to prevent exceeding storage quotas.
    const cardToSave = JSON.parse(JSON.stringify(currentCard));
    
    // Helper to remove audio
    const removeAudio = (s: any) => { if (s) delete s.audio; };
    
    if (cardToSave.sentences) {
        cardToSave.sentences.forEach(removeAudio);
    }
    if (cardToSave.tenses) {
        removeAudio(cardToSave.tenses.present);
        removeAudio(cardToSave.tenses.past);
        removeAudio(cardToSave.tenses.future);
    }

    const newCard: SavedCard = {
      ...cardToSave,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isFavorite: false,
      // tags field is now omitted/empty
    };

    setCollection(prev => [newCard, ...prev]);
  };

  const toggleFavorite = (id: string) => {
    setCollection(prev => prev.map(card => 
      card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
    ));
  };

  return (
    <div className="min-h-screen font-sans flex flex-col relative bg-slate-50">
      
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Great_Wave_off_Kanagawa2.jpg/2560px-Great_Wave_off_Kanagawa2.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.15, // Subtle transparency
          pointerEvents: 'none'
        }}
      />

      {/* Content Wrapper (Z-Index to float above background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header / Nav */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm transition-all">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('search')}>
              <div className="w-8 h-8 bg-japan-red rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                日
              </div>
              <h1 className="text-xl font-bold tracking-tight text-indigo-900 hidden sm:block">Alba NihonGo Dictionary</h1>
              <h1 className="text-xl font-bold tracking-tight text-indigo-900 sm:hidden">Alba</h1>
            </div>
            
            <nav className="flex gap-2 sm:gap-4">
              <button 
                onClick={() => setView('search')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${view === 'search' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-indigo-600'}`}
              >
                Search
              </button>
              <button 
                onClick={() => setView('collection')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${view === 'collection' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-indigo-600'}`}
              >
                My Deck <span className="ml-1 bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{collection.length}</span>
              </button>
              <button 
                onClick={() => setView('game')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${view === 'game' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-indigo-600'}`}
              >
                <span className="text-lg">🎮</span> <span className="hidden sm:inline">Game</span>
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col">
          
          {view === 'search' && (
            <div className="flex flex-col items-center justify-start pt-6 sm:pt-10 min-h-[80vh]">
              
              {/* Search Input */}
              <div className="w-full max-w-lg text-center mb-6 sm:mb-10 px-4">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-indigo-900 mb-2 tracking-tight">
                  Build your Vocabulary
                </h2>
                <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">Search in English, Romaji, or Japanese.</p>
                
                <form onSubmit={handleSearch} className="relative group">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Cat, Neko, 猫"
                    className="w-full h-12 sm:h-14 pl-5 sm:pl-6 pr-12 sm:pr-14 bg-white/90 backdrop-blur-sm rounded-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-base sm:text-lg transition-all shadow-sm"
                    disabled={loading}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </button>
                </form>
                {error && <p className="text-red-500 mt-4 text-sm font-medium animate-pulse">{error}</p>}
              </div>

              {/* Active Card Result */}
              {currentCard && (
                <div className="w-full flex flex-col items-center animate-float px-4">
                  <FlipCard 
                    key={currentCard.kanji + currentCard.romaji}
                    data={currentCard} 
                    onSave={handleSaveCard} 
                    isSaved={collection.some(c => c.kanji === currentCard.kanji && c.english[0] === currentCard.english[0])}
                  />
                  <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-full">Click card to flip</p>
                </div>
              )}

              {!currentCard && !loading && !error && (
                <div className="text-center opacity-30 mt-10">
                  <div className="text-6xl mb-4">🎴</div>
                  <p>Search a word to begin</p>
                </div>
              )}

            </div>
          )}
          
          {view === 'collection' && (
            <div className="pt-8">
              <div className="flex items-end justify-between mb-8 px-4">
                 <h2 className="text-2xl font-bold text-indigo-900 bg-white/60 px-4 py-2 rounded-lg backdrop-blur-sm">My Collection</h2>
              </div>
              <CollectionGrid cards={collection} onToggleFavorite={toggleFavorite} />
            </div>
          )}

          {view === 'game' && (
            <MemoryGame collection={collection} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;