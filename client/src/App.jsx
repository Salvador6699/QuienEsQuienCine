import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import { sounds } from './utils/audio';

import Navbar from './components/Navbar';
import RulesModal from './components/RulesModal';
import SettingsModal from './components/SettingsModal';
import LobbyView from './components/LobbyView';
import MovieSelector from './components/MovieSelector';
import GameBoard from './components/GameBoard';
import GuessModal from './components/GuessModal';
import GameOverModal from './components/GameOverModal';

export default function App() {
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guessTarget, setGuessTarget] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refereeThinking, setRefereeThinking] = useState(false);
  const [latestVerdict, setLatestVerdict] = useState(null);

  useEffect(() => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    const onConnect = () => {
      setMyPlayerId(socket.id);
    };

    const onRoomUpdated = (updatedRoom) => {
      setRoom(updatedRoom);
      setRefereeThinking(false);
    };

    const onRefereeThinking = () => {
      setRefereeThinking(true);
      sounds.playClapperSnap();
    };

    const onNewVerdict = (historyItem) => {
      setRefereeThinking(false);
      setLatestVerdict(historyItem);
      // Play sound for the first verdict in results
      if (historyItem?.results?.length > 0) {
        sounds.playVerdictChime(historyItem.results[0]?.verdict?.veredicto);
      }
    };

    const onGuessResult = (logEntry) => {
      if (logEntry?.isCorrect) {
        sounds.playVictoryFanfare();
      } else {
        sounds.playVerdictChime('NO');
      }
    };

    socket.on('connect', onConnect);
    socket.on('room:updated', onRoomUpdated);
    socket.on('game:referee-thinking', onRefereeThinking);
    socket.on('game:new-verdict', onNewVerdict);
    socket.on('game:guess-result', onGuessResult);

    if (socket.connected) {
      setMyPlayerId(socket.id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:referee-thinking', onRefereeThinking);
      socket.off('game:new-verdict', onNewVerdict);
      socket.off('game:guess-result', onGuessResult);
    };
  }, []);

  const me = room?.players.find(p => p.id === myPlayerId);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D13] text-gray-100 font-['Outfit',sans-serif]">
      {/* Top Bar */}
      <Navbar
        room={room}
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Game Phase Routing */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {(!room || room.status === 'LOBBY') && (
          <LobbyView
            room={room}
            myPlayerId={myPlayerId}
            onRoomCreated={(newRoom) => setRoom(newRoom)}
            onRoomJoined={(joinedRoom) => setRoom(joinedRoom)}
          />
        )}

        {room && room.status === 'SELECTING' && (
          <MovieSelector
            room={room}
            myPlayerId={myPlayerId}
          />
        )}

        {room && (room.status === 'PLAYING' || room.status === 'GAME_OVER') && (
          <GameBoard
            room={room}
            myPlayerId={myPlayerId}
            onOpenGuessModal={(target) => setGuessTarget(target)}
            refereeThinking={refereeThinking}
            latestVerdict={latestVerdict}
          />
        )}
      </main>

      {/* Modals */}
      <RulesModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <GuessModal
        isOpen={Boolean(guessTarget)}
        onClose={() => setGuessTarget(null)}
        target={guessTarget}
        myLives={me?.lives || 2}
        roomCode={room?.code}
      />

      <GameOverModal
        isOpen={room?.status === 'GAME_OVER'}
        room={room}
        myPlayerId={myPlayerId}
      />

      {/* Footer */}
      <footer className="w-full py-4 border-t border-gray-800/60 text-center text-xs text-gray-500 font-mono-code">
        CineClue PWA • Desarrollado con React, Tailwind CSS, TMDB & Gemini 3.8 Flash
      </footer>
    </div>
  );
}
