"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type DataTableColumn<Row> = {
  id: string;
  label: string;
  cell: (row: Row) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
};

export type DataTableSort = { columnId: string; direction: "asc" | "desc" };
export type DataTablePage = { limit: number; offset: number; total: number };

type DataTableProps<Row extends { id: string }> = {
  rows: Row[];
  columns: DataTableColumn<Row>[];
  caption: string;
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (search: string) => void;
  sort: DataTableSort;
  onSortChange: (sort: DataTableSort) => void;
  page: DataTablePage;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
  renderActions?: (row: Row) => ReactNode;
  actionsLabel?: string;
  emptyState: ReactNode;
};

const pageSizeOptions = [10, 25, 50, 100];

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis-right", totalPages] as const;
  if (currentPage >= totalPages - 3) return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages] as const;
}

export function DataTable<Row extends { id: string }>({ rows, columns, caption, search, searchPlaceholder = "Search records...", onSearchChange, sort, onSortChange, page, onLimitChange, onOffsetChange, renderActions, actionsLabel = "Actions", emptyState }: DataTableProps<Row>) {
  const [searchValue, setSearchValue] = useState(search);
  const latestSearchRef = useRef(search);
  const totalPages = Math.max(1, Math.ceil(page.total / page.limit));
  const currentPage = Math.min(Math.floor(page.offset / page.limit) + 1, totalPages);
  const start = page.total === 0 ? 0 : page.offset + 1;
  const end = Math.min(page.offset + rows.length, page.total);

  useEffect(() => {
    if (search === latestSearchRef.current) return;
    latestSearchRef.current = search;
    setSearchValue(search);
  }, [search]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchValue !== latestSearchRef.current) {
        latestSearchRef.current = searchValue;
        onSearchChange(searchValue);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [onSearchChange, searchValue]);

  function toggleSort(columnId: string) {
    onSortChange({ columnId, direction: sort.columnId === columnId && sort.direction === "asc" ? "desc" : "asc" });
  }

  function changeLimit(limit: number) { onLimitChange(limit); }

  return <div className="data-table-shell"><div className="data-table-toolbar"><div className="data-table-count" aria-live="polite">{page.total} {page.total === 1 ? "result" : "results"}</div><div className="search-field"><Icon name="search" /><input className="input-base" onChange={(event) => setSearchValue(event.target.value)} placeholder={searchPlaceholder} type="search" value={searchValue} /></div></div>{page.total === 0 ? emptyState : <><div className="table-scroll"><table className="data-table"><caption>{caption}</caption><thead><tr>{columns.map((column) => {
    const active = sort.columnId === column.id;
    if (column.sortable === false) return <th className={column.headerClassName} key={column.id} scope="col">{column.label}</th>;
    return <th aria-sort={!active ? "none" : sort.direction === "asc" ? "ascending" : "descending"} className={column.headerClassName} key={column.id} scope="col"><button aria-label={`${column.label}. ${active ? `Sorted ${sort.direction === "asc" ? "ascending" : "descending"}. Activate to sort ${sort.direction === "asc" ? "descending" : "ascending"}.` : "Activate to sort ascending."}`} className="data-table-sort" onClick={() => toggleSort(column.id)} type="button"><span>{column.label}</span><span aria-hidden="true" className={`data-table-sort-icon ${active ? "data-table-sort-active" : ""}`}>{active && sort.direction === "desc" ? "↓" : "↑"}</span></button></th>;
  })}{renderActions && <th scope="col">{actionsLabel}</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td className={column.className} key={column.id}>{column.cell(row)}</td>)}{renderActions && <td><div className="table-actions">{renderActions(row)}</div></td>}</tr>)}</tbody></table></div><footer className="data-table-pagination"><p aria-live="polite">Showing {start}–{end} of {page.total} results</p><div className="data-table-controls"><label className="data-table-page-size">Rows per page<select className="input-base" onChange={(event) => changeLimit(Number(event.target.value))} value={page.limit}>{pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><div aria-label="Pagination" className="data-table-pages"><button aria-label="Previous page" className="button button-secondary button-compact" disabled={page.offset === 0} onClick={() => onOffsetChange(Math.max(0, page.offset - page.limit))} type="button">Previous</button>{getPageNumbers(currentPage, totalPages).map((pageNumber) => typeof pageNumber === "string" ? <span aria-hidden="true" className="data-table-ellipsis" key={pageNumber}>…</span> : <button aria-current={pageNumber === currentPage ? "page" : undefined} aria-label={`Page ${pageNumber}`} className={`button button-compact ${pageNumber === currentPage ? "button-primary" : "button-secondary"}`} key={pageNumber} onClick={() => onOffsetChange((pageNumber - 1) * page.limit)} type="button">{pageNumber}</button>)}<button aria-label="Next page" className="button button-secondary button-compact" disabled={page.offset + page.limit >= page.total} onClick={() => onOffsetChange(page.offset + page.limit)} type="button">Next</button></div></div></footer></>}</div>;
}
