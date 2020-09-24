import React, { useState } from "react";
import { useFetcher, FetchKey } from "@decode/client";
import {
  CheckCircleOutlined,
  FrownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { notification } from "antd";

export default function useRequest() {
  let [processing, setProcessing] = useState(false);
  let fetcher = useFetcher();

  let fn = async (arg: FetchKey) => {
    setProcessing(true);

    let slug: any;
    let params: any;
    if (Array.isArray(arg)) {
      slug = arg[0];
      params = arg[1];
    } else {
      slug = arg;
    }

    // Don't open "processing" notification immediately
    let notificationTimeout = setTimeout(() => {
      notification.open({
        message: (
          <span>
            Processing request{" "}
            <span style={{ fontFamily: "monospace" }}>{slug}</span>...
          </span>
        ),
        icon: <LoadingOutlined />,
        duration: 30,
      });
    }, 750);

    try {
      let res = await fetcher(slug, params);
      clearTimeout(notificationTimeout);
      setProcessing(false);
      notification.destroy();
      notification.open({
        message: (
          <span>
            Request <span style={{ fontFamily: "monospace" }}>{slug}</span> ran
            successfully
          </span>
        ),
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        duration: 2,
      });
      return [res, null];
    } catch (e) {
      clearTimeout(notificationTimeout);
      setProcessing(false);
      notification.destroy();
      console.error(`Error when making request to Decode: ${e}`);
      let summary;
      try {
        summary = e.context.json.error.summary;
      } catch (e) {}

      notification.open({
        message: (
          <div>
            <p>
              Request <span style={{ fontFamily: "monospace" }}>{slug}</span>{" "}
              failed to run. See console for more details.
            </p>
            <p>
              Error (for nerds):{" "}
              <span style={{ fontFamily: "monospace" }}>
                {summary ? summary : `${e}`}
              </span>
            </p>
          </div>
        ),
        icon: <FrownOutlined style={{ color: "#cf1322" }} />,
        duration: 6,
      });
      return [null, e];
    }
  };

  return { request: fn, isProcessing: processing };
}
