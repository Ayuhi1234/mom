import { Link } from 'react-router-dom';
import { Clock, FileText, FileAudio } from 'lucide-react';

export default function MeetingCard({ meeting, hasMom }) {
  const platformLabel = {
    zoom: 'Zoom',
    google_meet: 'Google Meet',
    upload: 'Uploaded',
  };

  const platformColor = {
    zoom: 'bg-blue-100 text-blue-700',
    google_meet: 'bg-green-100 text-green-700',
    upload: 'bg-purple-100 text-purple-700',
  };

  return (
    <Link
      to={`/meeting/${meeting._id}`}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{meeting.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${platformColor[meeting.platform] || 'bg-gray-100 text-gray-700'}`}>
              {platformLabel[meeting.platform] || meeting.platform}
            </span>
          </div>
        </div>
        {hasMom ? (
          <FileText className="h-5 w-5 text-green-500" />
        ) : (
          <FileAudio className="h-5 w-5 text-gray-300" />
        )}
      </div>

      {meeting.startTime && (
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {new Date(meeting.startTime).toLocaleString()}
        </p>
      )}
    </Link>
  );
}
