import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingsAPI, momAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, RefreshCw, FileText, Clock, Users, Sparkles,
} from 'lucide-react';
import MOMViewer from '../components/MOMViewer';
import TranscriptViewer from '../components/TranscriptViewer';
import ExportMOM from '../components/ExportMOM';
import EmailMOM from '../components/EmailMOM';

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('mom');

  useEffect(() => {
    loadMeeting();
  }, [id]);

  async function loadMeeting() {
    setLoading(true);
    try {
      const { data: meetingData } = await meetingsAPI.getById(id);
      setMeeting(meetingData);

      try {
        const { data: momData } = await momAPI.getByMeeting(id);
        setMom(momData);
      } catch {
        setMom(null);
      }
    } catch (err) {
      toast.error('Failed to load meeting');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateMOM() {
    setGenerating(true);
    try {
      const { data } = await momAPI.generate(id);
      setMom(data);
      toast.success('MOM generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate MOM');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Meeting not found</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {meeting.startTime
                  ? new Date(meeting.startTime).toLocaleString()
                  : 'Not started'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                meeting.platform === 'zoom'
                  ? 'bg-blue-100 text-blue-700'
                  : meeting.platform === 'upload'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {meeting.platform === 'zoom' ? 'Zoom' : meeting.platform === 'upload' ? 'Uploaded' : 'Google Meet'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                meeting.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : meeting.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {meeting.status}
              </span>
              {meeting.participants?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {meeting.participants.length} participants
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {mom && <EmailMOM meetingId={meeting._id} />}
            {mom && <ExportMOM mom={mom} meetingTitle={meeting.title} />}
            <button
              onClick={handleGenerateMOM}
              disabled={generating || !meeting.transcript?.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mom ? 'Regenerate MOM' : 'Generate MOM'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('mom')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mom'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-1" /> Minutes of Meeting
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" /> Transcript
            {meeting.transcript?.length > 0 && (
              <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                {meeting.transcript.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'mom' ? (
        mom ? (
          <MOMViewer mom={mom} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              {meeting.transcript?.length > 0
                ? 'MOM has not been generated yet. Click "Generate MOM" to create meeting minutes.'
                : 'No transcript available. Upload a recording first.'}
            </p>
          </div>
        )
      ) : (
        <TranscriptViewer
          transcript={meeting.transcript || []}
          meetingId={meeting._id}
          onTranscriptUpdate={(updated) => setMeeting({ ...meeting, transcript: updated })}
        />
      )}
    </div>
  );
}
