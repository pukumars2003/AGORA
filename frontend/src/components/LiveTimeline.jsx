import React from 'react';
import { Clock, Cpu, MessageSquare, Bell, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

export default function LiveTimeline({ events }) {
  const getEventBadge = (type) => {
    switch (type) {
      case 'TOOL_CALLED':
        return { icon: Wrench, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', label: 'Tool Call' };
      case 'TOOL_COMPLETED':
        return { icon: Cpu, color: 'text-sky-600 bg-sky-50 border-sky-200', label: 'Tool Result' };
      case 'CONFIRMATION_DISPATCHED':
        return { icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'SMS/WhatsApp' };
      case 'REMINDER_TRIGGERED':
        return { icon: Bell, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Pre-visit Reminder' };
      case 'FOLLOWUP_FEEDBACK_REQUESTED':
        return { icon: CheckCircle2, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Follow-up' };
      case 'AGORA_AGENT_STARTED':
        return { icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Agora RTC' };
      default:
        return { icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Event' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">Agentic Execution & Follow-up Log</h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Live Stream
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No tool execution events yet. Initiate a booking flow or trigger a judge scenario to watch the agentic loop execute live!
          </p>
        ) : (
          events.map((evt) => {
            const badge = getEventBadge(evt.type);
            const Icon = badge.icon;
            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-md border ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-slate-800">{evt.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {evt.timestamp}
                  </span>
                </div>

                {evt.details && (
                  <div className="mt-1 text-slate-600 text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200/60 overflow-x-auto">
                    {typeof evt.details === 'string' ? (
                      evt.details
                    ) : evt.details.message ? (
                      <p className="text-slate-700 font-sans">
                        <strong className="text-brand-700">{evt.details.channel || 'Gateway'}:</strong> {evt.details.message}
                      </p>
                    ) : (
                      JSON.stringify(evt.details)
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
