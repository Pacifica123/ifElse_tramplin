import type { PropsWithChildren } from 'react';

interface PageStubProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function PageStub({ title, description, children }: PageStubProps) {
  return (
    <section className="page-card">
      <div className="page-card__header">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="page-card__content">{children}</div> : null}
    </section>
  );
}
