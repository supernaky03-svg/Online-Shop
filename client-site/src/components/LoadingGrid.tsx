export default function LoadingGrid() {
  return (
    <div className="grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="post-card skeleton" key={index}>
          <div className="post-card__imageWrap" />
          <div className="post-card__body">
            <div className="skeleton-line wide" />
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
