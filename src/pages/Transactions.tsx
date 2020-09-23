import React, { useState, useMemo } from "react";
import { Tag } from "antd";

import usePrevious from "../usePrevious";
import useDebounce from "../useDebounce";
import FishyEmoji from "../components/FishyEmoji";
import Layout from "../components/Layout";
import SearchInput from "../components/SearchInput";
import TransactionsTableCard from "../components/TransactionsTableCard";

import { ListTaggedTransactionIds, DateFilter } from "../types";
import "./Transactions.css";

import { useDecode, useFetcher } from "@decode/client";
import { ConnectedTable } from "../components/Table";

export default function Transactions() {
  let [processing, setProcessing] = useState<boolean>(false);
  let [dateFilter, setDateFilter] = useState<DateFilter>("all");

  let [search, setSearch] = useState("");
  let debouncedSearch = useDebounce(search, 500);

  // Stores the current selected row of the table
  let [selectedTransactionId, setSelectedTransactionId] = useState<string>();

  // Retrieve transactions tagged Fishy from api using Decode
  let { data, mutate } = useDecode<ListTaggedTransactionIds>([
    "listTaggedTransactionIds",
    { name: "fishy" },
  ]);
  let fishyIds = data?.ids || [];

  // Used for one-time request using Decode
  let fetcher = useFetcher();

  // Marks a transaction as fishy
  let markAsFishy = async () => {
    await fetcher("tagTransaction", {
      transaction_id: selectedTransactionId,
      body: { name: "fishy" },
    });
  };

  // Remove the fishy tag from a transaction
  let clearTags = async () => {
    await fetcher("untagTransaction", {
      transaction_id: selectedTransactionId,
      name: "fishy",
    });
  };

  // Handles the click in the "Not so Fishy" and "Mark as Fishy" buttons
  let handleFishyChange = async (operation: () => Promise<void>) => {
    if (!selectedTransactionId) return;

    setProcessing(true);
    try {
      await operation(); // executes the request operation
      await mutate(); // updates the fishy status in the table
    } catch {}
    setProcessing(false);
  };

  let previousFishyIds = usePrevious(fishyIds);

  let memoizedColumns = useMemo(
    () => [
      {
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
      },
      ...columns,
    ],
    [fishyIds.length]
  );

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
        processing={processing}
        disableButtons={!selectedTransactionId}
        onFishyClick={() => handleFishyChange(markAsFishy)}
        onClearClick={() => handleFishyChange(clearTags)}
        onDateFilterChange={setDateFilter}
      >
        <ConnectedTable
          loading={!data}
          fetchKey={[
            "listTransactionsTest",
            {
              description: `%${debouncedSearch}%`,
              dateMin: dateFromDateFilter(dateFilter),
            },
          ]}
          onSelectRow={(row: any) => setSelectedTransactionId(row.id)}
          columns={memoizedColumns as any}
        />
      </TransactionsTableCard>
    </Layout>
  );
}

const oneWeek = 1000 * 60 * 60 * 24 * 7;

let dateFromDateFilter = (dateFilter: DateFilter) => {
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
  }
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
