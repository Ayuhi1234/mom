import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { meetingsAPI, momAPI, uploadAPI } from '../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Upload, FileText, RefreshCw, Clock, Loader2, CheckCircle,
  FileAudio, X,
} from 'lucide-react';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();

    const socket = io(window.location.origin, { withCredentials: true });

    socket.on('upload-status', (data) => {
      if (data.status === 'transcribing') {
        setUploadProgress('Transcribing audio with Whisper...');
      } else if (data.status === 'generating_mom') {
        setUploadProgress('Generating MOM with AI...');
      } else if (data.status === 'done') {
        setUploadProgress('');
        setUploading(false);
        toast.success('MOM generated successfully!');
        loadData();
      } else if (data.status === 'error') {
        setUploadProgress('');
        setUploading(false);
        toast.error('Processing failed: ' + (data.error || 'Unknown error'));
      }
    });

    return () => socket.disconnect();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [meetingsRes, momsRes] = await Promise.allSettled([
        meetingsAPI.getAll(),
        momAPI.getAll(),
      ]);
      if (meetingsRes.status === 'fulfilled') setMeetings(meetingsRes.value.data);
      if (momsRes.status === 'fulfilled') setMoms(momsRes.value.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress('Uploading file...');

    const formData = new FormData();
    formData.append('recording', selectedFile);
    formData.append('title', uploadTitle || selectedFile.name.replace(/\.[^/.]+$/, ''));

    try {
      await uploadAPI.uploadRecording(formData);
      setUploadProgress('Transcribing audio with Whisper...');
      setSelectedFile(null);
      setUploadTitle('');
      setShowUpload(false);
    } catch (err) {
      setUploading(false);
      setUploadProgress('');
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUpload(true);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUpload(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Upload meeting recordings to generate MOM</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Upload Processing Banner */}
      {uploading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium">{uploadProgress}</span>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.mp4,.wav,.m4a,.webm,.ogg,.flac"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          Upload Meeting Recording
        </h3>
        <p className="text-gray-500 text-sm mb-2">
          Drag & drop or click to select an audio/video file
        </p>
        <p className="text-xs text-gray-400">
          Supports: MP3, MP4, WAV, M4A, WebM, OGG, FLAC (max 100MB)
        </p>
      </div>

      {/* Upload Modal */}
      {showUpload && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload & Generate MOM</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3 mb-4">
              <FileAudio className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title (optional)
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Weekly Standup - June 23"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
              <p className="font-medium mb-1">What happens next:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>File is uploaded to the server</li>
                <li>Whisper AI transcribes the audio</li>
                <li>AI generates structured MOM</li>
              </ol>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowUpload(false); setSelectedFile(null); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload & Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Meetings with MOMs */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" /> Meeting Minutes
        </h2>

        {meetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No meetings yet. Upload a recording to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const mom = moms.find((m) => m.meeting?._id === meeting._id);
              return (
                <Link
                  key={meeting._id}
                  to={`/meeting/${meeting._id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {meeting.title}
                        </h3>
                        {mom ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" /> MOM Ready
                          </span>
                        ) : meeting.status === 'failed' ? (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            Failed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <Loader2 className="h-3 w-3 animate-spin" /> Processing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(meeting.startTime || meeting.createdAt).toLocaleDateString()}
                        </span>
                        {mom && (
                          <>
                            <span>{mom.actionItems?.length || 0} action items</span>
                            <span>{mom.decisions?.length || 0} decisions</span>
                          </>
                        )}
                      </div>
                      {mom && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{mom.summary}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
