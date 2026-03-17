import type { ReactNode } from "react";

interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
}

const Table = <T,>({
  columns,
  data,
  rowKey,
  emptyText = "Không có dữ liệu",
}: TableProps<T>) => {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[
                            String(column.key)
                          ] ?? "",
                        )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="ui-table__empty">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
