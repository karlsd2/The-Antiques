import { Icon } from './Icon';

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <div><span>{eyebrow}</span><h2>{title}</h2></div>
      {action && <button className="text-link" onClick={onAction}>{action}<Icon name="arrow" size={17} /></button>}
    </div>
  );
}
