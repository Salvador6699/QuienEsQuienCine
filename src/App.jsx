import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SetupView from './components/SetupView';
import MovieChooser from './components/MovieChooser';
import DetectiveBoard from './components/DetectiveBoard';
import GuessModal from './components/GuessModal';
import ScoreboardModal from './components/ScoreboardModal';
import RulesModal from './components/RulesModal';
import { sounds } from './utils/audio';

export default function App() {
  // Game Setup & Players
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState('SETUP'); // 'SETUP' | 'CHOOSING' | 'PLAYING'

  // Round State
  const [roundNumber, setRoundNumber] = useState(1);
  const [directorIndex, setDirectorIndex] = useState(0);
  const [activeDetectiveIndex, setActiveDetectiveIndex] = useState(0);
  const [secretMovie, setSecretMovie] = useState(null);
  const [cluesUsed, setCluesUsed] = useState({ soundtrack: false, photogram: false });
  const [currentPoints, setCurrentPoints] = useState(100);
  const [questionHistory, setQuestionHistory] = useState([]);

  // Modals & UI
  const [rulesOpen, setRulesOpen] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Round Winner Info
  const [roundWinner, setRoundWinner] = useState(null);
  const [pointsWon, setPointsWon] = useState(0);

  // Derived state
  const currentDirector = players[directorIndex] || { name: 'Director', avatar: '🎬' };
  const detectives = players.filter((_, idx) => idx !== directorIndex);
  const activeDetective = detectives[activeDetectiveIndex] || detectives[0] || { name: 'Detective', avatar: '🕵️‍♂️' };
  const nextDirectorIndex = players.length > 0 ? (directorIndex + 1) % players.length : 0;
  const nextDirector = players[nextDirectorIndex];

  // Start new game from setup
  const handleStartGame = (configuredPlayers) => {
    setPlayers(configuredPlayers);
    setGameStarted(true);
    setRoundNumber(1);
    setDirectorIndex(0);
    startRoundForDirector(0, configuredPlayers);
  };

  // Prepare round for director
  const startRoundForDirector = (dIdx, currentPlayersList = players) => {
    setDirectorIndex(dIdx);
    setActiveDetectiveIndex(0);
    setSecretMovie(null);
    setCluesUsed({ soundtrack: false, photogram: false });
    setCurrentPoints(100);
    setQuestionHistory([]);
    setRoundWinner(null);
    setPointsWon(0);
    setGamePhase('CHOOSING');
  };

  // When Director confirms the movie with the AI
  const handleConfirmMovie = (movieData) => {
    setSecretMovie(movieData);
    setGamePhase('PLAYING');
  };

  // Clue usage (-20 pts each)
  const handleUseClue = (clueType) => {
    if (cluesUsed[clueType]) return;

    sounds.playClueDeduction();
    setCluesUsed((prev) => ({ ...prev, [clueType]: true }));
    setCurrentPoints((prev) => Math.max(0, prev - 20));
  };

  // Add question from active detective (each question deducts 1 point)
  const handleAddQuestion = (questionItem) => {
    setQuestionHistory((prev) => [...prev, questionItem]);
    setCurrentPoints((prev) => Math.max(0, prev - 1));
  };

  // Cycle to the next detective turn
  const handleNextDetectiveTurn = () => {
    if (detectives.length <= 1) return;
    sounds.playClapperSnap();
    setActiveDetectiveIndex((prev) => (prev + 1) % detectives.length);
  };

  // When active detective guesses correctly
  const handleSuccessGuess = (winningDetective, earnedPoints) => {
    setRoundWinner(winningDetective);
    setPointsWon(earnedPoints);

    // Update player score in general table
    setPlayers((prev) =>
      prev.map((p) => (p.id === winningDetective.id ? { ...p, score: p.score + earnedPoints } : p))
    );

    setScoreboardOpen(true);
  };

  // When detectives surrender
  const handleSurrender = () => {
    sounds.playClapperSnap();
    setRoundWinner(null);
    setPointsWon(0);
    setScoreboardOpen(true);
  };

  // When detective guesses incorrectly
  const handleFailedGuess = () => {
    handleNextDetectiveTurn();
  };

  // Advance to next round (rotates Director)
  const handleNextRound = () => {
    setScoreboardOpen(false);
    setRoundNumber((prev) => prev + 1);
    const nextIdx = (directorIndex + 1) % players.length;
    startRoundForDirector(nextIdx);
  };

  // Reset entire game back to setup
  const handleResetGame = () => {
    setScoreboardOpen(false);
    setGameStarted(false);
    setGamePhase('SETUP');
    setPlayers([]);
  };

  const isPlaying = gamePhase === 'PLAYING';

  return (
    <div className={`w-full bg-[#0B0D13] text-gray-100 font-['Outfit',sans-serif] ${
      isPlaying ? 'h-[100dvh] flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'
    }`}>
      {/* Top Navbar */}
      <Navbar
        gameStarted={gameStarted}
        roundNumber={roundNumber}
        director={currentDirector}
        onOpenRules={() => setRulesOpen(true)}
        onOpenScoreboard={() => setScoreboardOpen(true)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Content Phases */}
      <main className={`w-full max-w-7xl mx-auto ${
        isPlaying ? 'flex-1 min-h-0 flex flex-col overflow-hidden px-2 sm:px-4 py-1 sm:py-2' : 'flex-1 py-4 px-4'
      }`}>
        {gamePhase === 'SETUP' && (
          <SetupView
            onStartGame={handleStartGame}
          />
        )}

        {gamePhase === 'CHOOSING' && (
          <MovieChooser
            director={currentDirector}
            onConfirmMovie={handleConfirmMovie}
          />
        )}

        {gamePhase === 'PLAYING' && secretMovie && (
          <DetectiveBoard
            roundNumber={roundNumber}
            movie={secretMovie}
            director={currentDirector}
            detectives={detectives}
            activeDetectiveIndex={activeDetectiveIndex}
            currentPoints={currentPoints}
            cluesUsed={cluesUsed}
            questionHistory={questionHistory}
            onUseClue={handleUseClue}
            onAddQuestion={handleAddQuestion}
            onOpenGuessModal={() => setGuessModalOpen(true)}
            onSurrender={handleSurrender}
            onNextDetectiveTurn={handleNextDetectiveTurn}
          />
        )}
      </main>

      {/* Modals */}
      <GuessModal
        isOpen={guessModalOpen}
        onClose={() => setGuessModalOpen(false)}
        movie={secretMovie}
        activeDetective={activeDetective}
        currentPoints={currentPoints}
        onSuccessGuess={handleSuccessGuess}
        onFailedGuess={handleFailedGuess}
      />

      <ScoreboardModal
        isOpen={scoreboardOpen}
        roundNumber={roundNumber}
        winner={roundWinner}
        pointsWon={pointsWon}
        movie={secretMovie}
        players={players}
        nextDirector={nextDirector}
        onNextRound={handleNextRound}
        onResetGame={handleResetGame}
      />

      <RulesModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      {/* Footer only outside playing phase to maximize game screen */}
      {!isPlaying && (
        <footer className="w-full py-4 border-t border-gray-800/60 text-center text-xs text-gray-500">
          CineClue • Impulsado por Gemini AI
        </footer>
      )}
    </div>
  );
}
