import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { meetingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Radio } from 'lucide-react';

export default function LiveMeeting() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [botStatus, setBotStatus] = useState('connecting');
  const transcriptEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadMeeting();

    socketRef.current = io(window.location.origin, { withCredentials: true });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-meeting', id);
    });

    socketRef.current.on('transcript-update', (data) => {
      if (data.meetingId === id) {
        setTranscript((prev) => [...prev, data.entry]);
      }
    });

    socketRef.current.on('bot-status', (data) => {
      if (data.meetingId === id) {
        setBotStatus(data.status);
        if (data.status === 'in_progress') {
          toast.success('Bot has joined the meeting!');
        }
      }
    });

    socketRef.current.on('meeting-completed', (data) => {
      if (data.meetingId === id) {
        setBotStatus('completed');
        toast.success('Meeting ended. MOM is being generated...');
      }
    });

    socketRef.current.on('mom-generated', (data) => {
      if (data.meetingId === id) {
        toast.success('MOM generated! View it in the meeting detail page.');
      }
    });

    return () => {
      socketRef.current?.emit('leave-meeting', id);
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  async function loadMeeting() {
    try {
      const { data } = await meetingsAPI.getById(id);
      setMeeting(data);
      setTranscript(data.transcript || []);
      setBotStatus(data.status);
    } catch {
      toast.error('Failed to load meeting');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to={`/meeting/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Meeting
      </Link>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${
            botStatus === 'in_progress'
              ? 'bg-red-500 animate-pulse'
              : botStatus === 'completed'
              ? 'bg-green-500'
              : 'bg-yellow-500 animate-pulse'
          }`} />
          <div>
            <h2 className="font-semibold text-gray-900">{meeting?.title || 'Loading...'}</h2>
            <p className="text-sm text-gray-500">
              {botStatus === 'in_progress'
                ? 'Recording in progress...'
                : botStatus === 'bot_joining'
                ? 'Bot is joining the meeting...'
                : botStatus === 'completed'
                ? 'Meeting completed'
                : 'Connecting...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Radio className="h-4 w-4" />
            {transcript.length} segments
          </span>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900">Live Transcript</h3>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {transcript.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              {botStatus === 'in_progress'
                ? 'Waiting for speech...'
                : 'Transcript will appear here when the bot joins the meeting.'}
            </div>
          ) : (
            transcript.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-20 text-xs text-gray-400 pt-1">
                  {formatTime(entry.timestamp)}
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">
                    {entry.speaker || 'Unknown'}
                  </span>
                  <p className="text-sm text-gray-700">{entry.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
