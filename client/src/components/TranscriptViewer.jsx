import { useState } from 'react';
import { momAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Users, Pencil, Save, X } from 'lucide-react';

export default function TranscriptViewer({ transcript, meetingId, onTranscriptUpdate }) {
  const [editingSpeakers, setEditingSpeakers] = useState(false);
  const [speakerMap, setSpeakerMap] = useState({});

  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No transcript available yet.</p>
      </div>
    );
  }

  const speakers = [...new Set(transcript.map((e) => e.speaker).filter(Boolean))];
  const colors = [
    'text-blue-600', 'text-green-600', 'text-purple-600',
    'text-orange-600', 'text-pink-600', 'text-teal-600',
  ];

  function getSpeakerColor(speaker) {
    const index = speakers.indexOf(speaker);
    return colors[index % colors.length];
  }

  function startEditSpeakers() {
    const map = {};
    speakers.forEach((s) => { map[s] = s; });
    setSpeakerMap(map);
    setEditingSpeakers(true);
  }

  async function saveSpeakers() {
    const hasChanges = Object.entries(speakerMap).some(([k, v]) => k !== v && v.trim());
    if (!hasChanges) {
      setEditingSpeakers(false);
      return;
    }

    try {
      const { data } = await momAPI.updateSpeakers(meetingId, speakerMap);
      if (onTranscriptUpdate) onTranscriptUpdate(data);
      setEditingSpeakers(false);
      toast.success('Speaker names updated!');
    } catch {
      toast.error('Failed to update speakers');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Speaker legend */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Speakers:</span>
          {meetingId && (
            editingSpeakers ? (
              <div className="flex gap-2">
                <button onClick={saveSpeakers} className="text-green-600 hover:text-green-700 p-1">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingSpeakers(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditSpeakers}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Pencil className="h-3 w-3" /> Rename Speakers
              </button>
            )
          )}
        </div>

        {editingSpeakers ? (
          <div className="space-y-2 mt-2">
            {speakers.map((speaker) => (
              <div key={speaker} className="flex items-center gap-2">
                <span className={`text-sm font-medium w-24 ${getSpeakerColor(speaker)}`}>
                  {speaker} →
                </span>
                <input
                  type="text"
                  value={speakerMap[speaker] || ''}
                  onChange={(e) => setSpeakerMap({ ...speakerMap, [speaker]: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter real name"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {speakers.map((speaker) => (
              <span key={speaker} className={`text-sm font-medium ${getSpeakerColor(speaker)}`}>
                {speaker}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Transcript entries */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {transcript.map((entry, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex-shrink-0 w-16 text-xs text-gray-400 pt-1 text-right">
              {formatTime(entry.timestamp)}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-semibold ${getSpeakerColor(entry.speaker)}`}>
                {entry.speaker || 'Unknown'}
              </span>
              <p className="text-sm text-gray-700 mt-0.5">{entry.text}</p>
            </div>
          </div>
        ))}
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
