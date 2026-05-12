import Link from 'next/link';

interface TopbarProps {
  tag?: string;
  rightLabel?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ tag, rightLabel, actions }: TopbarProps) {
  return (
    <nav className="topbar">
      <div className="topbar-brand">
        <div className="pulse-logo">
          <div className="heart-rate">
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="28px" viewBox="0 0 150 73" xmlSpace="preserve">
              <polyline fill="none" stroke="#ed1c24" strokeWidth="3" strokeMiterlimit="10" points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" />
            </svg>
            <div className="fade-in" />
            <div className="fade-out" />
          </div>
          <span className="brand-name">CNT <span>PULSE</span></span>
        </div>
        {tag && <span className="topbar-tag">{tag}</span>}
      </div>
      <div className="topbar-actions">
        {rightLabel && <span className="topbar-right">{rightLabel}</span>}
        {actions}
      </div>
    </nav>
  );
}
