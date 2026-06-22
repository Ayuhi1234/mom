import { useState } from 'react';
import { momAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Send, X, Plus, Loader2 } from 'lucide-react';

export default function EmailMOM({ meetingId }) {
  const [showModal, setShowModal] = useState(false);
  const [emails, setEmails] = useState(['']);
  const [sending, setSending] = useState(false);

  function addEmail() {
    setEmails([...emails, '']);
  }

  function removeEmail(index) {
    setEmails(emails.filter((_, i) => i !== index));
  }

  function updateEmail(index, value) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  async function handleSend() {
    const valid = emails.filter((e) => e.trim() && e.includes('@'));
    if (valid.length === 0) {
      toast.error('Enter at least one valid email');
      return;
    }

    setSending(true);
    try {
      await momAPI.emailMOM(meetingId, valid);
      toast.success(`MOM sent to ${valid.length} recipient(s)!`);
      setShowModal(false);
      setEmails(['']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
      >
        <Mail className="h-4 w-4" /> Email
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" /> Email MOM
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Send the meeting minutes to participants via email.
            </p>

            <div className="space-y-2 mb-4">
              {emails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {emails.length > 1 && (
                    <button
                      onClick={() => removeEmail(i)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addEmail}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4"
            >
              <Plus className="h-4 w-4" /> Add another recipient
            </button>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send MOM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
