import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  console.log('⚡️ ユーザーが WebSocket に接続')

  // ✅ チャットルームに参加
  socket.on('joinChat', (chatId) => {
    socket.join(chatId)
    console.log(`🧩 ユーザーがチャットルーム ${chatId} に参加`)
  })

  // ✅ メッセージ送信を部屋ごとにブロードキャスト（自分以外）
  socket.on('sendMessage', ({ chatId, message }) => {
    console.log('📩 新しいメッセージ:', message)
    socket.to(chatId).emit('newMessage', { chatId, message })
  })

  socket.on('disconnect', () => {
    console.log('❌ ユーザーが切断しました')
  })
})

httpServer.listen(3001, () => {
  console.log('🚀 WebSocket サーバー起動 (ポート: 3001)')
})
