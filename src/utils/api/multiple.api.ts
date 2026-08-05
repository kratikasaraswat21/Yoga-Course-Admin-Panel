/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

import { getDataFromSecureCookie } from "@/utils/helper/helper";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface EndpointObject {
  endPoint: string;
  method?: ApiMethod;
  protected?: boolean;
  header?: Record<string, string>;
  data?: unknown;
}

export interface CommonDataFormat {
  message: string;
  success: boolean;
  data: Record<string, any>;
}

export interface ApiReturnInterface {
  data?: CommonDataFormat;
  error?: unknown;
  status?: number;
  ok: boolean;
}

const getUrl = (endPoint: string) => `${BASE_URL.replace(/\/$/, "")}/${endPoint.replace(/^\//, "")}`;

const axiosApiErrorHandler = (error: unknown): ApiReturnInterface => {
  if (axios.isAxiosError(error)) {
    return {
      data: error.response?.data,
      error: error.response?.data ?? error.message,
      ok: false,
      status: error.response?.status,
    };
  }

  return { error, ok: false };
};

const fetchEndpoint = async (endpoint: EndpointObject, signal?: AbortSignal): Promise<ApiReturnInterface> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...endpoint.header,
  };

  if (endpoint.protected && !headers.Authorization) {
    const token = getDataFromSecureCookie("authenticationToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await axios({
      data: endpoint.data,
      headers,
      method: endpoint.method ?? "GET",
      signal,
      url: getUrl(endpoint.endPoint),
    });

    return {
      data: response.data,
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return axiosApiErrorHandler(error);
  }
};

export const multipleApiHandler = async (
  endPointArr: EndpointObject[],
  signal?: AbortSignal,
): Promise<ApiReturnInterface[]> => Promise.all(endPointArr.map((endpoint) => fetchEndpoint(endpoint, signal)));
