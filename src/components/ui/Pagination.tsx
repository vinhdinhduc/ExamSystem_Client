interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="ui-pagination">
      <button
        type="button"
        className="ui-pagination__nav"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        Trước
      </button>
      <div className="ui-pagination__pages">
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            className={`ui-pagination__page ${item === page ? "ui-pagination__page--active" : ""}`.trim()}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="ui-pagination__nav"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Sau
      </button>
    </div>
  );
};

export default Pagination;
