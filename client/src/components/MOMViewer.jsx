import { useState } from 'react';
import { momAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Target, MessageSquare, CheckCircle2,
  ListChecks, ArrowRight, Circle, Pencil, Save, X,
} from 'lucide-react';

export default function MOMViewer({ mom: initialMom }) {
  const [mom, setMom] = useState(initialMom);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(field, value) {
    setEditing(field);
    setEditValue(Array.isArray(value) ? value.join('\n') : value);
  }

  async function saveEdit(field) {
    try {
      const value = field === 'summary'
        ? editValue
        : editValue.split('\n').filter((l) => l.trim());

      const { data } = await momAPI.update(mom._id, { [field]: value });
      setMom(data);
      setEditing(null);
      toast.success('Saved!');
    } catch {
      toast.error('Failed to save');
    }
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue('');
  }

  async function toggleActionItem(itemId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const { data } = await momAPI.updateActionItem(mom._id, itemId, { status: newStatus });
      setMom(data);
    } catch {
      toast.error('Failed to update');
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <EditableSection
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        title="Summary"
        field="summary"
        editing={editing}
        editValue={editValue}
        setEditValue={setEditValue}
        onEdit={() => startEdit('summary', mom.summary)}
        onSave={() => saveEdit('summary')}
        onCancel={cancelEdit}
        textarea
      >
        <p className="text-gray-700 leading-relaxed">{mom.summary}</p>
      </EditableSection>

      {/* Agenda Items */}
      {mom.agendaItems?.length > 0 && (
        <EditableSection
          icon={<Target className="h-5 w-5 text-purple-600" />}
          title="Agenda Items"
          field="agendaItems"
          editing={editing}
          editValue={editValue}
          setEditValue={setEditValue}
          onEdit={() => startEdit('agendaItems', mom.agendaItems)}
          onSave={() => saveEdit('agendaItems')}
          onCancel={cancelEdit}
        >
          <ul className="space-y-2">
            {mom.agendaItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </EditableSection>
      )}

      {/* Key Discussion Points */}
      {mom.keyDiscussionPoints?.length > 0 && (
        <EditableSection
          icon={<MessageSquare className="h-5 w-5 text-green-600" />}
          title="Key Discussion Points"
          field="keyDiscussionPoints"
          editing={editing}
          editValue={editValue}
          setEditValue={setEditValue}
          onEdit={() => startEdit('keyDiscussionPoints', mom.keyDiscussionPoints)}
          onSave={() => saveEdit('keyDiscussionPoints')}
          onCancel={cancelEdit}
        >
          <ul className="space-y-2">
            {mom.keyDiscussionPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <Circle className="h-2 w-2 text-green-500 mt-2 flex-shrink-0 fill-green-500" />
                {point}
              </li>
            ))}
          </ul>
        </EditableSection>
      )}

      {/* Decisions */}
      {mom.decisions?.length > 0 && (
        <EditableSection
          icon={<CheckCircle2 className="h-5 w-5 text-orange-600" />}
          title="Decisions Made"
          field="decisions"
          editing={editing}
          editValue={editValue}
          setEditValue={setEditValue}
          onEdit={() => startEdit('decisions', mom.decisions)}
          onSave={() => saveEdit('decisions')}
          onCancel={cancelEdit}
        >
          <ul className="space-y-2">
            {mom.decisions.map((decision, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                {decision}
              </li>
            ))}
          </ul>
        </EditableSection>
      )}

      {/* Action Items */}
      {mom.actionItems?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-red-600" /> Action Items
          </h3>
          <div className="space-y-3">
            {mom.actionItems.map((item) => (
              <div
                key={item._id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <button
                  onClick={() => toggleActionItem(item._id, item.status)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${
                    item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'
                  }`}>
                    {item.description}
                  </p>
                  {item.assignee && (
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: <span className="font-medium">{item.assignee}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {mom.nextSteps?.length > 0 && (
        <EditableSection
          icon={<ArrowRight className="h-5 w-5 text-indigo-600" />}
          title="Next Steps"
          field="nextSteps"
          editing={editing}
          editValue={editValue}
          setEditValue={setEditValue}
          onEdit={() => startEdit('nextSteps', mom.nextSteps)}
          onSave={() => saveEdit('nextSteps')}
          onCancel={cancelEdit}
        >
          <ul className="space-y-2">
            {mom.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <ArrowRight className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </EditableSection>
      )}

      <p className="text-xs text-gray-400 text-right">
        Generated: {new Date(mom.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

function EditableSection({ icon, title, field, editing, editValue, setEditValue, onEdit, onSave, onCancel, textarea, children }) {
  const isEditing = editing === field;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {icon} {title}
        </h3>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={onSave} className="text-green-600 hover:text-green-700 p-1">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-gray-400 hover:text-blue-600 p-1">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={textarea ? 4 : Math.max(3, editValue.split('\n').length + 1)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={textarea ? 'Edit text...' : 'One item per line...'}
        />
      ) : (
        children
      )}
    </div>
  );
}
