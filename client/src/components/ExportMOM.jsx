import { Download, FileText, File } from 'lucide-react';

export default function ExportMOM({ mom, meetingTitle }) {
  function generateMarkdown() {
    let md = `# Minutes of Meeting\n\n`;
    md += `**Meeting:** ${meetingTitle}\n`;
    md += `**Date:** ${new Date(mom.generatedAt).toLocaleDateString()}\n\n`;
    md += `---\n\n`;

    md += `## Summary\n${mom.summary}\n\n`;

    if (mom.agendaItems?.length) {
      md += `## Agenda Items\n`;
      mom.agendaItems.forEach((item, i) => { md += `${i + 1}. ${item}\n`; });
      md += '\n';
    }

    if (mom.keyDiscussionPoints?.length) {
      md += `## Key Discussion Points\n`;
      mom.keyDiscussionPoints.forEach((p) => { md += `- ${p}\n`; });
      md += '\n';
    }

    if (mom.decisions?.length) {
      md += `## Decisions Made\n`;
      mom.decisions.forEach((d) => { md += `- ${d}\n`; });
      md += '\n';
    }

    if (mom.actionItems?.length) {
      md += `## Action Items\n`;
      mom.actionItems.forEach((item) => {
        const check = item.status === 'completed' ? '[x]' : '[ ]';
        const assignee = item.assignee ? ` *(${item.assignee})*` : '';
        md += `- ${check} ${item.description}${assignee}\n`;
      });
      md += '\n';
    }

    if (mom.nextSteps?.length) {
      md += `## Next Steps\n`;
      mom.nextSteps.forEach((s) => { md += `- ${s}\n`; });
      md += '\n';
    }

    md += `---\n*Generated: ${new Date(mom.generatedAt).toLocaleString()}*\n`;
    return md;
  }

  function downloadMarkdown() {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOM-${meetingTitle.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const md = generateMarkdown();
    const html = markdownToHTML(md);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MOM - ${meetingTitle}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.6; }
          h1 { font-size: 24px; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
          h2 { font-size: 18px; color: #334155; margin-top: 24px; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 6px; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
          em { color: #64748b; }
          strong { color: #1e293b; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  function markdownToHTML(md) {
    return md
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr>')
      .replace(/^- \[x\] (.*)$/gm, '<li style="list-style:none">&#9745; $1</li>')
      .replace(/^- \[ \] (.*)$/gm, '<li style="list-style:none">&#9744; $1</li>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadMarkdown}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
      >
        <File className="h-4 w-4" /> Markdown
      </button>
      <button
        onClick={exportPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
      >
        <Download className="h-4 w-4" /> PDF
      </button>
    </div>
  );
}
