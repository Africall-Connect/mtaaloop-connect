import { MousePointerClick, ClipboardList, UserCheck, CheckCircle2, ChevronRight } from 'lucide-react';

const steps = [
  { icon: MousePointerClick, label: 'Choose', desc: 'Pick a service' },
  { icon: ClipboardList, label: 'Set Details', desc: 'Tell us what you need' },
  { icon: UserCheck, label: 'Match', desc: 'We assign an agent' },
  { icon: CheckCircle2, label: 'Done & Paid', desc: 'Service completed' },
];

export function HowItWorksStrip() {
  return (
    <div className="bg-muted/50 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">How It Works</h3>
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1.5">
                <span className="text-xs font-bold text-primary absolute -mt-8 -ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                  {i + 1}
                </span>
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold leading-tight">{step.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 -mt-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
