import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  useTable,
  useFlexLayout,
  useResizeColumns,
  usePagination,
  Column,
  Cell,
  TableProps,
  useRowSelect,
  useSortBy,
} from "react-table";
import { EllipsisOutlined } from "@ant-design/icons";
import { Popover, Button } from "antd";

import "./Table.css";
import { FetchKey, useDecode, ErrorCard } from "@decode/client";
import FetchingMask from "./FetchingMask";
import { renderDate } from "../util";
import usePrevious from "../usePrevious";

interface Props<D extends object = {}> {
  data: D[];
  dataHash?: any; // Used to determine if the table should reset
  autoReset?: boolean;
  columns?: Array<Column<D>>;
  hiddenColumns?: string[];
  pageSize?: number;
  loading?: boolean;
  onSelectRow?(data: D): void;
  confirmSelectRow?: boolean;
  minRowHeight?: string | number;
}

export default function Table<D extends object = {}>({
  columns,
  hiddenColumns,
  data,
  dataHash,
  autoReset = true,
  loading,
  pageSize = 10,
  onSelectRow,
  confirmSelectRow,
  minRowHeight,
}: Props<D>) {
  let [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  let rowSelected = typeof selectedRowIndex === "number";
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
      Formatted: FormattedCell,
      ForPopover: ForPopoverCell,
    }),
    []
  );
  let defaultColumns = useDefaultColumns(data);

  // Used to determine if the table should reset
  let memoizedDataHash = useMemo(() => dataHash, [dataHash]);
  let previousDataHash = usePrevious(memoizedDataHash);

  let shouldReset =
    (autoReset &&
      memoizedDataHash === undefined &&
      previousDataHash === undefined) ||
    memoizedDataHash !== previousDataHash;

  // Used to determine if the sorting should reset
  let memoizedColumns = useMemo(() => columns ?? defaultColumns, [
    columns,
    defaultColumns,
  ]);
  let previousColumns = usePrevious(memoizedColumns);

  let shouldResetSorting = memoizedColumns !== previousColumns;

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    toggleAllRowsSelected,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    prepareRow,
    state: { pageIndex },
  } = useTable(
    {
      columns: columns ?? defaultColumns,
      data,
      defaultColumn,
      autoResetSelectedRows: false,
      autoResetPage: shouldReset,
      autoResetExpanded: shouldReset,
      autoResetGroupBy: shouldReset,
      autoResetSortBy: shouldResetSorting,
      autoResetFilters: shouldReset,
      autoResetRowState: shouldReset,
      initialState: {
        pageSize,
        hiddenColumns: hiddenColumns ?? [],
      },
    },
    useFlexLayout,
    useResizeColumns,
    useSortBy,
    usePagination,
    useRowSelect
  );

  let totalResults = rows.length;

  let [minWidthStyle, tableProps] = popMinWidthStyle(getTableProps());
  let showSelectButton = rowSelected && confirmSelectRow && onSelectRow;
  let noRowsFound = (data ?? []).length === 0;

  // Render the UI for your table
  return (
    <div className="table-widget">
      <div style={{ position: "relative", height: "100%" }}>
        <div className="ReactTable">
          <div {...(tableProps as any)} className="rt-table pagination-bottom">
            <div style={minWidthStyle} className="rt-thead -header">
              {headerGroups.map((headerGroup) => (
                <div {...headerGroup.getHeaderGroupProps()} className="rt-tr">
                  {headerGroup.headers.map((column) => (
                    <div
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="rt-th rt-resizable-header -cursor-pointer"
                    >
                      <div className="rt-resizable-header-content">
                        <div>
                          <div className="rt-column-header-name">
                            {column.render("Header")}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Use column.getResizerProps to hook up the events correctly */}
                      <div
                        {...column.getResizerProps()}
                        className={`rt-resizer${column.isResizing ? "" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div
              {...getTableBodyProps({
                style: {
                  ...minWidthStyle,
                  ...(noRowsFound ? { minHeight: "100px" } : {}),
                },
              })}
              className="rt-tbody"
            >
              {page.map((row, i) => {
                prepareRow(row);
                return (
                  <div
                    {...row.getRowProps({ style: { minHeight: minRowHeight } })}
                    onClick={() => {
                      setSelectedRowIndex(row.index);
                      if (!confirmSelectRow) {
                        onSelectRow && onSelectRow(data[row.index]);
                      }
                    }}
                    className={`rt-tr table-row ${
                      i % 2 === 1 ? "-odd" : "-even"
                    }${row.index === selectedRowIndex ? " selected" : ""}`}
                  >
                    {row.cells.map((cell) => {
                      let { style, ...rest } = cell.getCellProps();

                      return (
                        <div
                          {...rest}
                          style={{ ...style, padding: "0px" }}
                          className="rt-td"
                        >
                          <div className="cell-container">
                            <InnerCellContainer cell={cell} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pagination-bottom">
            <div className="-pagination flex">
              <div className="-left flex" style={{ justifySelf: "start" }}>
                <div className="table-results-counter">
                  {totalResults} results
                </div>
              </div>
              <div className="-center">
                <div className="-previous">
                  <Button
                    aria-label="Previous"
                    disabled={!canPreviousPage}
                    onClick={() => previousPage()}
                    className="decode-button ant-btn-link-gray"
                    style={{
                      height: "26px",
                      padding: "0px 2px",
                      marginTop: "2px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      type="caret-left"
                      className="decode-icon decode-icon-caret-left"
                    >
                      <path
                        d="M11.1426 8L8.99972 10.5L11.1426 13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="square"
                      ></path>
                    </svg>
                  </Button>
                </div>
                <span className="-pageInfo">
                  Page
                  <PageJumpInput
                    pageIndex={pageIndex}
                    onSubmit={(page: number) => gotoPage(page)}
                  />
                  of <span className="-totalPages">{pageCount}</span>
                </span>
                <div className="-next">
                  <Button
                    aria-label="Next"
                    disabled={!canNextPage}
                    onClick={() => nextPage()}
                    className="decode-button ant-btn-link-gray"
                    style={{
                      height: "26px",
                      padding: "0px 2px",
                      marginTop: "2px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      type="caret-right"
                      className="decode-icon decode-icon-caret-right"
                    >
                      <path
                        d="M10 8L12.1429 10.5L10 13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="square"
                      ></path>
                    </svg>
                  </Button>
                </div>
              </div>
              {showSelectButton ? (
                <SelectRowAction
                  onClick={() =>
                    rowSelected &&
                    onSelectRow &&
                    onSelectRow(data[selectedRowIndex as number])
                  }
                />
              ) : (
                <TableActions />
              )}
            </div>
          </div>
          {noRowsFound && <div className="rt-noData">No rows found</div>}
        </div>
      </div>

      <FetchingMask fetching={loading} />
    </div>
  );
}

let SelectRowAction = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="table-actions flex items-center">
      <Button
        onClick={onClick}
        aria-label="Select"
        className="decode-button"
        type="primary"
      >
        Select
      </Button>
    </div>
  );
};

let TableActions = () => {
  return (
    <div className="table-actions flex items-center">
      <Button
        aria-label="Add filters"
        className="decode-button"
        style={{ padding: "0px 4px" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          type="filter"
          className="decode-icon decode-icon-filter"
        >
          <path
            d="M14.9543 4.30298C15.0343 4.52333 15.0143 4.70362 14.8543 4.84384L10.9944 8.68996V15.4992C10.9944 15.7196 10.8944 15.8798 10.6944 15.9599C10.6344 15.98 10.5544 16 10.4944 16C10.3544 16 10.2344 15.9599 10.1344 15.8598L8.13443 13.8566C8.03444 13.7564 7.99444 13.6362 7.99444 13.496V8.68996L4.15452 4.84384C3.99452 4.68359 3.95452 4.5033 4.05452 4.30298C4.13452 4.10266 4.29451 4.0025 4.51451 4.0025H14.4943C14.7143 3.98247 14.8543 4.08263 14.9543 4.30298Z"
            fill="currentColor"
          ></path>
        </svg>
      </Button>
      <Button
        aria-label="Reload table data"
        className="decode-button"
        style={{ padding: "0px 4px" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          type="refresh"
          className="decode-icon decode-icon-refresh"
        >
          <path
            d="M15.6953 4.53889C15.4818 4.45051 15.2996 4.48685 15.1485 4.64832L14.1328 5.65622C13.5755 5.13016 12.9389 4.72264 12.2227 4.43357C11.5065 4.14453 10.7656 4 10 4C9.18753 4 8.4115 4.15893 7.67192 4.47659C6.93229 4.79428 6.29426 5.22128 5.75782 5.75774C5.22137 6.29426 4.79425 6.93221 4.47656 7.67179C4.1589 8.41142 4 9.18733 4 9.99992C4 10.8123 4.1589 11.5884 4.47659 12.328C4.79436 13.0676 5.22137 13.7056 5.75785 14.2421C6.29428 14.7784 6.93232 15.2055 7.67195 15.5232C8.41153 15.8409 9.18755 15.9998 10 15.9998C10.8958 15.9998 11.7476 15.8111 12.5548 15.4334C13.362 15.0559 14.0495 14.5233 14.6173 13.8358C14.6589 13.7837 14.6785 13.7251 14.6758 13.66C14.6733 13.5949 14.6484 13.5415 14.6016 13.4999L13.5315 12.4218C13.474 12.375 13.4091 12.3516 13.3361 12.3516C13.2528 12.362 13.193 12.3933 13.1565 12.4454C12.7762 12.9403 12.3101 13.323 11.758 13.594C11.206 13.8648 10.6201 14.0001 10.0002 14.0001C9.45867 14.0001 8.94172 13.8946 8.44953 13.6836C7.95729 13.4728 7.53147 13.1876 7.17216 12.8282C6.81288 12.4688 6.52772 12.0431 6.31675 11.5508C6.10583 11.0587 6.00035 10.5419 6.00035 10.0001C6.00035 9.45848 6.10591 8.94142 6.31675 8.44934C6.52764 7.95721 6.81277 7.53138 7.17216 7.17208C7.53157 6.81268 7.95729 6.52753 8.44953 6.31656C8.94161 6.10567 9.45867 6.00016 10.0002 6.00016C11.0471 6.00016 11.956 6.35695 12.7269 7.0705L11.6485 8.14846C11.487 8.30473 11.4507 8.48445 11.5391 8.68754C11.6277 8.89589 11.7814 9.00003 12.0002 9.00003H15.5002C15.6356 9.00003 15.7527 8.95059 15.8517 8.85161C15.9506 8.75267 16.0001 8.6355 16.0001 8.50008V5.00005C16 4.78136 15.8987 4.62772 15.6953 4.53889Z"
            fill="currentColor"
          ></path>
        </svg>
      </Button>
    </div>
  );
};

let popMinWidthStyle = (props: Partial<TableProps>) => {
  let { style, ...rest } = props;
  let { minWidth, ...restStyle } = style ?? {};
  let tableProps = { ...rest, ...restStyle };
  let minWidthStyle: { minWidth: number | string } | {} = minWidth
    ? { minWidth }
    : {};
  return [minWidthStyle, tableProps];
};

let PageJumpInput = ({
  pageIndex,
  onSubmit,
}: {
  pageIndex: number;
  onSubmit(n: number): void;
}) => {
  let [state, setState] = useState(pageIndex + 1);

  useEffect(() => {
    setState(pageIndex + 1);
  }, [pageIndex]);

  return (
    <div className="-pageJump">
      <input
        aria-label="Page number"
        type="number"
        value={state}
        onChange={({ currentTarget: { value } }) =>
          setState(parseInt(value, 10))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit(state - 1);
          }
        }}
        style={{
          width: 16.44 + 7.56 * state.toString().length,
          marginLeft: "4px",
          marginRight: "4px",
          fontSize: "12px",
        }}
      />
    </div>
  );
};

let InnerCellContainer = <D extends object = {}>({
  cell,
}: {
  cell: Cell<D, any>;
}) => {
  let node = useRef<HTMLDivElement | null>(null);
  let [_ignored, setRefReady] = useState(false);

  let overflown = false;
  if (node && node.current) {
    let { scrollWidth, clientWidth } = node.current;
    overflown = scrollWidth !== clientWidth;
  }

  // useEffect(() => {
  //   if (scrollWidth !== clientWidth) {
  //     setOverflown(true);
  //   }
  // }, [scrollWidth, clientWidth]);

  let className = `inner-cell-container ${
    overflown ? "inner-cell-container--overflown" : ""
  }`;

  return (
    <div
      ref={(ref) => {
        if (!node.current) {
          node.current = ref;
          setRefReady(true);
        } else {
          node.current = ref;
        }
      }}
      className={className}
    >
      {cell.render("Formatted")}
      {overflown && (
        <Popover
          overlayClassName="decode-popover"
          content={
            <pre>
              <code style={{ fontSize: "0.8em" }}>
                {cell.render("ForPopover")}
              </code>
            </pre>
          }
        >
          <EllipsisOutlined
            style={{ right: "10px" }}
            className="expand-cell-button"
          />
        </Popover>
      )}
    </div>
  );
};

let FormattedCell = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) {
    return <span className="null-cell">–</span>;
  }

  if (value === true) {
    return (
      <span title="✔" className="boolean-cell-true">
        ✔
      </span>
    );
  }

  if (value === false) {
    return (
      <span title="✘" className="boolean-cell-false">
        ✘
      </span>
    );
  }

  if (value instanceof Date) {
    return renderDate(value);
  }

  if (typeof value === "object") {
    return <code>{JSON.stringify(value)}</code>;
  }

  return String(value);
};

let ForPopoverCell = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 4);
  }

  return String(value);
};

export let CentsCell = ({ value }: { value: number }) => {
  return `$${(+value / 100).toFixed(2)}`;
};

interface CTProps extends Omit<Props, "data"> {
  fetchKey: FetchKey;
  transform?(data: any): any;
}

export function ConnectedTable<D>({ fetchKey, transform, ...rest }: CTProps) {
  let { data, error } = useDecode<D>(fetchKey, transform);

  if (error) {
    return <ErrorCard error={error} />;
  }

  return (
    <Table
      loading={rest.loading || !data}
      data={(data ?? []) as any}
      {...rest}
    />
  );
}

let useDefaultColumns = <D extends object = {}>(
  data?: D[]
): Array<Column<D>> => {
  let firstElement = data && data[0];
  let firstElementKeys = firstElement ? Object.keys(firstElement) : [];

  return React.useMemo(() => {
    if (firstElementKeys.length > 0) {
      return firstElementKeys.map((key) => ({
        Header: key,
        accessor: key as any,
        id: key,
      }));
    }
    return [
      {
        Header: "Loading or blank",
        accessor: "na",
        id: "na",
      },
    ];
  }, [firstElementKeys.length]);
};

// const columns = React.useMemo(
//   () => [
//     {
//       Header: "Age",
//       accessor: "age",
//       id: "age"
//     },
//     {
//       Header: "Visits",
//       accessor: "visits",
//       id: "visits"
//     },
//     {
//       Header: "Status",
//       accessor: "status",
//       id: "status"
//     },
//     {
//       Header: "Profile Progress",
//       accessor: "progress",
//       id: "progress"
//     },
//     {
//       Header: "Likes Beach",
//       accessor: "likesBeach",
//       id: "likesBeach"
//     },
//     {
//       Header: "Null",
//       accessor: "null",
//       id: "null"
//     }
//   ],
//   []
// );
