import Link from "next/link";

export function SiteHeader() {
  return (
    <div className="container">
      <header className="site-header">
        <Link className="site-header-name" href="/">
          Event planning
        </Link>
        <Link className="btn btn-sm" href="/demo">
          Try the demo
        </Link>
      </header>
    </div>
  );
}
