import { Icon } from './Icon';

export function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <span className={`badge ${dark ? "badge-dark" : ""}`}><Icon name="shield" size={13} />{children}</span>;
}
