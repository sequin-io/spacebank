import React, { useState, useMemo } from "react";
import { Tag } from "antd";

import usePrevious from "./usePrevious";
import useDebounce from "./useDebounce";
import FishyEmoji from "./components/FishyEmoji";
import Layout from "./components/Layout";
import SearchInput from "./components/SearchInput";
import TransactionsTableCard from "./components/TransactionsTableCard";

import { ListTaggedTransactionIds, DateFilter } from "./types";
import "./App.css";

import { useDecode } from "@decode/client";
import useRequest from "./useRequest";
import { ConnectedTable } from "./components/Table";

export default function App() {
  let [dateFilter, setDateFilter] = useState("all");

  let [search, setSearch] = useState("");
  let debouncedSearch = useDebounce(search, 500);

  // Stores the current selected row of the table
  let [selectedTransactionId, setSelectedTransactionId] = useState<string>();

  // Retrieve transactions tagged Fishy from api using Decode
  // TODO: let { data, mutate } = useDecode<ListTaggedTransactionIds>([])
  let fishyIds: string[] = [];

  let fishyColumn = useIsFishyColumn(fishyIds);
  let memoizedColumns = useMemo(() => [fishyColumn, ...columns], [
    fishyIds.length,
  ]);

  return (
    <Layout className="transactions" title="Transactions">
      <p>
        We'll use this app to mark suspicious transactions as
        <Tag color="warning" className="transactions-tag">
          Fishy <FishyEmoji />
        </Tag>
      </p>
      <SearchInput value={search} onChange={setSearch} />
      <TransactionsTableCard
        processing={false}
        disableButtons={!selectedTransactionId}
        onFishyClick={() => {}}
        onClearClick={() => {}}
        onDateFilterChange={setDateFilter}
      >
        <div className="table-placeholder">
          <span>Table will go here</span>
        </div>
      </TransactionsTableCard>
    </Layout>
  );
}

const oneWeek = 1000 * 60 * 60 * 24 * 7;

let dateFromDateFilter = (dateFilter: string) => {
  switch (dateFilter) {
    case "all": {
      return new Date(1).toISOString();
    }
    case "last-week": {
      return new Date(Date.now() - oneWeek).toISOString();
    }
    case "last-two-weeks": {
      return new Date(Date.now() - oneWeek * 2).toISOString();
    }
    default: {
      throw new Error(`Unhandled date fitler: ${dateFilter}`);
    }
  }
};

let useIsFishyColumn = (fishyIds: string[]) => {
  let previousFishyIds = usePrevious(fishyIds);

  return {
    Header: "Is fishy?",
    width: 64,
    id: "tag",
    Formatted: (cell: any) => {
      let transactionId = cell.row.original.id;

      if (fishyIds.includes(transactionId)) {
        return (
          <FishyEmoji
            animateEnter={!previousFishyIds?.includes(transactionId)}
          />
        );
      }

      return <></>;
    },
  };
};

let columns = [
  {
    Header: "Amount",
    accessor: "amount_in_cents",
    id: "amount_in_cents",
    width: 64,
    Formatted: ({ value }: any) => (
      <>
        {value < 0 ? "-" : "+"}${Math.abs(value) / 100}
      </>
    ),
  },
  {
    Header: "Description",
    accessor: "description",
    id: "description",
  },
  {
    Header: "Is pending?",
    accessor: "is_pending",
    id: "is_pending",
    width: 64,
  },
  {
    Header: "Inserted at",
    accessor: "inserted_at",
    id: "inserted_at",
  },
  {
    Header: "Updated at",
    accessor: "updated_at",
    id: "updated_at",
  },
];
