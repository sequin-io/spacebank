import React, { useState } from "react";
import { Card, Row, Col, Button, Space, Select } from "antd";
import FishyEmoji from "./FishyEmoji";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { DateFilter } from "../types";

import "./TransactionsTableCard.css";

const { Option } = Select;
const antIcon = <LoadingOutlined style={{ fontSize: 18 }} spin />;

interface Props {
  processing?: boolean;
  disableButtons?: boolean;
  onFishyClick?: () => void;
  onClearClick?: () => void;
  onDateFilterChange?: (value: DateFilter) => void;
}

export default function TransactionsTableCard({
  processing,
  disableButtons,
  onFishyClick,
  onClearClick,
  children,
  onDateFilterChange,
}: React.PropsWithChildren<Props>) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const handleSelectChange = (value: DateFilter) => {
    setDateFilter(value);
    onDateFilterChange && onDateFilterChange(value);
  };

  return (
    <Card
      size="small"
      bodyStyle={{ padding: "1px" }}
      className="transactions-table-card"
      title={
        <Row>
          <Col flex="auto">Results</Col>
          <Col>
            <Space>
              <Select
                value={dateFilter}
                onChange={handleSelectChange}
                className="transactions-table-card-select"
                size="small"
              >
                <Option value="all">All</Option>
                <Option value="last-week">Last 7 days</Option>
                <Option value="last-two-weeks">Last two weeks</Option>
              </Select>
              <Button
                size="small"
                disabled={disableButtons || processing}
                onClick={onClearClick}
              >
                Not so Fishy
              </Button>
              <Button
                type="primary"
                size="small"
                danger
                disabled={disableButtons || processing}
                onClick={onFishyClick}
              >
                <Space size={2}>
                  <span>Mark as Fishy</span> <FishyEmoji />
                </Space>
              </Button>
              {processing && <Spin indicator={antIcon} />}
            </Space>
          </Col>
        </Row>
      }
    >
      {children}
    </Card>
  );
}
