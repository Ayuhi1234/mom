const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const botRoutes = require('./routes/bot');
const momRoutes = require('./routes/mom');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

connectDB();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [process.env.CLIENT_URL || 'http://localhost:5173'];
    if (!origin || allowed.includes(origin) || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/mom', momRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-meeting', (meetingId) => {
    socket.join(`meeting:${meetingId}`);
  });

  socket.on('leave-meeting', (meetingId) => {
    socket.leave(`meeting:${meetingId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
