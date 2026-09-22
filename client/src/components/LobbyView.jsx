import React, { useState, useEffect } from 'react';
import { Clapperboard, Users, Play, Copy, Check, Sparkles, Film, ArrowRight, ShieldCheck, UserPlus, Crown, MessageSquare, Send } from 'lucide-react';
import { socketService } from '../services/socket';
import { sounds } from '../utils/audio';

const AVATARS = ['🎬', '🍿', '🕵️‍♂️', '🎥', '🏆', '🎞️', '🎭', '🧛', '🛸', '🤠', '📽️', '🦁'];

export default function LobbyView({ room, myPlayerId, onRoomCreated, onRoomJoined }) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('cineclue_name') || 'Cinéfilo ' + Math.floor(Math.random() * 90 + 10));
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('cineclue_avatar') || '🎬');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Auto-fill join code from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem('cineclue_name', playerName);
    localStorage.setItem('cineclue_avatar', selectedAvatar);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return setError('Introduce tu nombre o apodo');
    setError('');
    setLoading(true);
    saveProfile();
    sounds.playClapperSnap();

    try {
      const res = await socketService.createRoom({
        name: playerName.trim(),
        avatar: selectedAvatar
      });
      onRoomCreated(res.room);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return setError('Introduce tu nombre o apodo');
    if (!joinCode.trim()) return setError('Introduce el código de la sala');
    setError('');
    setLoading(true);
    saveProfile();
    sounds.playClapperSnap();

    try {
      const res = await socketService.joinRoom(joinCode.trim().toUpperCase(), {
        name: playerName.trim(),
        avatar: selectedAvatar
      });
      onRoomJoined(res.room);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSelection = async () => {
    if (!room?.code) return;
    sounds.playClapperSnap();
    try {
      await socketService.startSelection(room.code);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyInvite = () => {
    if (!room?.code) return;
    const url = `${window.location.origin}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    sounds.playClapperSnap();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !room?.code) return;
    socketService.sendChat(room.code, chatInput);
    setChatInput('');
  };

  const isHost = room?.hostId === myPlayerId;
  const canStart = isHost && room?.players.length >= 2;

  // VIEW 1: Outside of room (Create or Join)
  if (!room) {
    return (
      <div className="max-w-md mx-auto my-6 px-4">
        {/* Ticket Header Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#181C28] to-[#10131E] border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 shadow-inner">
              <Clapperboard className="w-10 h-10 animate-bounce" />
            </div>
            <h1 className="text-3xl font-black font-cinema tracking-wide bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              CINECLUE
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono-code">
              El "¿Quién es Quién?" del Séptimo Arte
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Profile Setup */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Tu Nombre de Director / Jugador
              </label>
              <input
                type="text"
                maxLength={20}
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Ej: Tarantino99, Neo, cinéfilo..."
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-gray-700 focus:border-amber-500 focus:outline-none text-sm text-gray-100 placeholder-gray-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Elige tu Avatar de Cine
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => { setSelectedAvatar(av); sounds.playClapperSnap(); }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === av
                        ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                        : 'bg-black/30 border border-gray-800 hover:bg-gray-800/60'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-gray-800 w-full"></div>
            <span className="bg-[#121520] px-3 text-[10px] text-gray-500 font-mono uppercase">Modo de entrada</span>
          </div>

          {/* Actions: Create or Join */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-black" />
              Crear Nueva Sala (Anfitrión)
            </button>

            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO (EJ: CINEMA)"
                className="w-2/3 px-4 py-3 rounded-xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-xs font-mono uppercase text-gray-200 tracking-wider placeholder:normal-case placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-1/3 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-100 font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                Unirse
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // VIEW 2: Inside Lobby (Waiting for players)
  return (
    <div className="max-w-3xl mx-auto my-6 px-4">
      <div className="rounded-3xl bg-[#121520] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        
        {/* Lobby Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-amber-400 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              SALA DE ESPERA • {room.players.length} / 8 JUGADORES
            </div>
            <h2 className="text-2xl font-black font-cinema text-gray-100">
              Camerino de Directores
            </h2>
          </div>

          <button
            onClick={handleCopyInvite}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-mono-code transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Enlace de invitación copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar Enlace de Sala: <strong>{room.code}</strong></span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Players Grid */}
        <div className="my-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Participantes en la sala
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map(player => {
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                    isMe
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-black/30 border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-800/80 border border-gray-700 flex items-center justify-center text-2xl">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-200">{player.name}</span>
                        {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">Tú</span>}
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        {player.isHost ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Anfitrión
                          </span>
                        ) : (
                          'Invitado'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Conectado"></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action button for Host */}
        <div className="pt-4 border-t border-gray-800">
          {isHost ? (
            <div className="space-y-2">
              <button
                onClick={handleStartSelection}
                disabled={!canStart}
                className={`w-full py-4 rounded-2xl font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/25 cursor-pointer scale-100 hover:scale-101'
                    : 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-800'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {canStart
                  ? '¡COMENZAR SELECCIÓN DE PELÍCULAS!'
                  : 'Esperando al menos 2 jugadores para comenzar...'}
              </button>
              {!canStart && (
                <p className="text-center text-[11px] text-gray-500">
                  Comparte el código <strong>{room.code}</strong> o abre otra pestaña de incógnito para probar el multijugador.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center text-xs text-amber-300/80">
              Esperando a que el anfitrión comience la partida... ¡Prepárate para elegir tu película secreta!
            </div>
          )}
        </div>

        {/* Mini Chat / Banter in Lobby */}
        <div className="mt-8 pt-6 border-t border-gray-800/80">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            Canal del Plató (Chat)
          </h4>
          
          <div className="h-28 overflow-y-auto rounded-xl bg-black/40 border border-gray-800/80 p-3 space-y-1.5 mb-2 text-xs">
            {room.messages?.length === 0 ? (
              <span className="text-gray-600 italic">¡Saluda a tus rivales antes de empezar!</span>
            ) : (
              room.messages?.map(msg => (
                <div key={msg.id} className="flex items-start gap-1.5">
                  <span className="font-semibold text-amber-400/90">{msg.senderName}:</span>
                  <span className="text-gray-300">{msg.text}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              maxLength={100}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-gray-700 text-xs text-gray-200 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
