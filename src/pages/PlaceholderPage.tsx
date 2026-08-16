import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./PlaceholderPage.css";

type PlaceholderPageProps = {
  title: string;
  path: string;
  note?: string;
  children?: ReactNode;
};

/** Minimal route shell — layouts come later */
export function PlaceholderPage({
  title,
  path,
  note,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <header className="placeholder-page__header">
        <Link to="/" className="placeholder-page__home">
          New Balance
        </Link>
      </header>
      <main className="placeholder-page__main">
        <p className="placeholder-page__eyebrow">Placeholder</p>
        <h1 className="placeholder-page__title">{title}</h1>
        <p className="placeholder-page__path">{path}</p>
        {note ? <p className="placeholder-page__note">{note}</p> : null}
        {children}
      </main>
    </div>
  );
}
