import { STYLE_META } from "../constants/tweetforge";

export default function TweetCard({ tweet, index, globalIndex, onCopy, copied }) {
  const meta = STYLE_META[tweet.style?.toLowerCase()] || STYLE_META.engaging;
  const over = tweet.text.length > 280;
  const near = tweet.text.length > 250;

  return (
    <div className="tweet-card" style={{ animation: `slideUp 0.4s ease ${index * 0.05}s both` }}>
      <div className="tweet-card-row">
        <div className="tweet-card-index">{String(globalIndex + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tweet-card-meta">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 20,
                background: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.color}22`,
              }}
            >
              {meta.label}
            </span>
            <button className="tweet-card-copy" onClick={() => onCopy(tweet.text, index)}>
              {copied === index ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="tweet-card-text">{tweet.text}</p>
          {tweet.note && <p className="tweet-card-note">{tweet.note}</p>}
          <div className="tweet-card-count" style={{ color: over ? "var(--danger)" : near ? "#F59E0B" : "#94A3B8" }}>
            {tweet.text.length} / 280
          </div>
        </div>
      </div>
    </div>
  );
}
