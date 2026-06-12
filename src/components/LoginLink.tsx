import type { ReactNode } from 'react';

export default function LoginLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/api/auth/login" className={className}>
      {children}
    </a>
  );
}
