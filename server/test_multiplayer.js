import { io } from 'socket.io-client';

async function runTest() {
  console.log('🚀 Starting CineClue Socket E2E Test...');

  const socketA = io('http://localhost:3001');
  const socketB = io('http://localhost:3001');

  await Promise.all([
    new Promise(res => socketA.on('connect', res)),
    new Promise(res => socketB.on('connect', res))
  ]);

  console.log('✓ Both sockets connected');

  // Player A creates room
  const createRes = await new Promise(res => {
    socketA.emit('room:create', { name: 'Player A', avatar: '🎬' }, res);
  });
  console.log('✓ Room created with code:', createRes.code);
  const code = createRes.code;

  // Player B joins room
  const joinRes = await new Promise(res => {
    socketB.emit('room:join', { code, player: { name: 'Player B', avatar: '🍿' } }, res);
  });
  console.log('✓ Player B joined. Total players:', joinRes.room.players.length);

  // Player A starts selection
  await new Promise(res => {
    socketA.emit('room:start-selection', { code }, res);
  });
  console.log('✓ Selection phase started');

  // Player A picks El Padrino (ID: 238)
  const movieA = await fetch('http://localhost:3001/api/tmdb/movie/238').then(r => r.json());
  await new Promise(res => {
    socketA.emit('room:set-movie', { code, movieDetails: movieA.movie }, res);
  });
  console.log('✓ Player A selected secret movie');

  // Player B picks Titanic (ID: 597)
  const movieB = await fetch('http://localhost:3001/api/tmdb/movie/597').then(r => r.json());
  await new Promise(res => {
    socketB.emit('room:set-movie', { code, movieDetails: movieB.movie }, res);
  });
  console.log('✓ Player B selected secret movie');

  // Wait 200ms for status to transition to PLAYING
  await new Promise(r => setTimeout(r, 200));

  // Player A asks question: "¿Es una película anterior al 2000?" targeting Player B
  console.log('❓ Player A asking question to Player B...');
  const askRes = await new Promise(res => {
    socketA.emit('game:ask-question', {
      code,
      targetId: socketB.id,
      question: '¿Es una película anterior al 2000?'
    }, res);
  });
  console.log('✓ Question answered by Referee Gemini:');
  console.log('  Question:', askRes.historyItem.question);
  console.log('  Verdict:', askRes.historyItem.results[0].verdict);

  // Player B guesses Player A's movie: "El Padrino"
  console.log('🎯 Player B resolving Player A movie: "El Padrino"...');
  const guessRes = await new Promise(res => {
    socketB.emit('game:guess-movie', {
      code,
      targetId: socketA.id,
      guessedTitle: 'El Padrino'
    }, res);
  });
  console.log('✓ Guess result: isCorrect =', guessRes.isCorrect);

  socketA.disconnect();
  socketB.disconnect();

  console.log('🎉 E2E Test completed successfully!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
