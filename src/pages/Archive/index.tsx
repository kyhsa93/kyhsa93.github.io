import { Link } from 'react-router-dom';
import { posts } from '../../data/posts';
import { useSeo } from '../../hooks/useSeo';

export default function Archive() {
  useSeo({
    title: 'All posts',
    description: `Every post, in one place — ${posts.length} write-ups on DDD, CQRS, and backend architecture.`,
    path: '/posts',
  });

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" to="/">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </Link>
        <div className="nav-links">
          <Link to="/">← Home</Link>
        </div>
      </nav>

      <section className="archive-section">
        <p className="section-kicker">Writing</p>
        <h1 className="archive-heading">All posts</h1>
        <div className="content-label">
          <span>Writing</span>
          <span>{posts.length} posts</span>
        </div>
        {posts.map((post) => (
          <article className="post-item published" key={post.slug}>
            <div className="post-meta">
              <time>{post.date}</time>
              <span>{post.tags.join(' · ')}</span>
            </div>
            <h3>
              <Link to={`/posts/${post.slug}`}>
                {post.title}
                <span aria-hidden="true">→</span>
              </Link>
            </h3>
            <p>{post.summary}</p>
          </article>
        ))}
      </section>

      <footer>
        <p>Let’s build something resilient.</p>
        <div className="footer-links">
          <Link to="/privacy-policy">Privacy</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93 →
          </a>
        </div>
      </footer>
    </main>
  );
}
