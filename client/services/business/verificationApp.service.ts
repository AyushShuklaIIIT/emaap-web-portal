import { api } from "@/lib/api";
import { backendUrl } from "@/lib/backend-url";
import { io, Socket } from "socket.io-client";

export interface VerificationAppData {
  app_id: string;
  application_no: string;
  app_type: "INITIAL" | "RE_VERIFICATION";
  submission_timestamp: Date;
  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

  instrument_id: string;
  business_id: string;
  assigned_officer_id?: string;
  assigned_gatc_id?: string;
}

export interface VerificationForm {
  applicationId: string;
  instrumentCategory: string;
  instrumentSubCategory: string;
  modelNo: string;
  accuracyClass: "Class I" | "Class II" | "Class III" | "Class IIII";
  manufacturerName: string;
  instrumentSerialNumber: string;
  metric: string;
  address: string;
  district: string;
  pincode: number;
  state: string;
  lat: number;
  long: number;
  manufacturerFileUrl?: string | null;
  prevCertificateFileUrl?: string | null;
}

export type AppType = "INITIAL" | "RE_VERIFICATION";

export type PaymentMethod = "UPI" | "NET_BANKING" | "NEFT_RTGS";

export interface VerificationCategory {
  category_id: string;
  category_code: string;
  category_name: string;
  accuracy_class: "CLASS_I" | "CLASS_II" | "CLASS_III" | "CLASS_IIII";
  oiml_standard_ref: string;
  verification_cycle_months: number;
}

export interface VerificationState {
  state_id: string;
  state_code: string;
  state_name: string;
}

export interface VerificationMetadata {
  categories: VerificationCategory[];
  states: VerificationState[];
}

export interface VerificationFeeQuote {
  statutoryFee: number;
  additionalFee: number;
  totalAmount: number;
  feeBasis: string;
  condition: string | null;
  maximumFee: number | null;
}

export interface CreateVerificationApplicationPayload {
  userId: string;
  appType: AppType;
  categoryCode: string;
  instrumentSubCategory: string;
  modelNo: string;
  manufacturerName: string;
  instrumentSerialNumber: string;
  metric: string;
  address: string;
  district: string;
  pincode: number;
  stateCode: string;
  lat: number;
  long: number;
  paymentMethod: PaymentMethod;
  manufacturerFileUrl?: string | null;
  prevCertificateFileUrl?: string | null;
  applicationId?: string;
}

export interface CreateVerificationApplicationResponse {
  applicationId: string;
  applicationNo: string;

  instrumentId: string;

  workflowStatus: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

  applicationType: AppType;

  payment: {
    receiptId: string;
    receiptNo: string;
    transactionId: string | null;
    paymentMethod: PaymentMethod | null;
    paymentStatus: string;
    totalAmount: number;
  };

  category: {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    accuracyClass: string;
  };

  state: {
    stateId: string;
    stateCode: string;
    stateName: string;
  };

  fee: VerificationFeeQuote;
}

export interface UploadVerificationDocumentsResponse {
  success: boolean;
  message: string;
  manufacturerFileUrl: string;
  prevCertificateFileUrl: string | null;
  applicationId: string;
}

interface VerificationPersistenceResponse {
  success: boolean;
  applicationId: string;
  applicationNo: string;
  instrumentId: string;
  serialNumber: string;
  businessId: string;
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("Server returned an invalid response");
  }

  if (!response.ok || !body || typeof body !== "object") {
    throw new Error("Request failed");
  }

  const result = body as {
    success?: boolean;
    message?: string;
    data?: T;
  };

  if (result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result.data as T;
};

export const getVerificationApp = async (
  userId: string,
): Promise<VerificationAppData> => {
  const response = await api.get(`/verification/${userId}`);

  return response.data.data;
};

export const postVerificationApp = async (
  userId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const response = await api.post(`/verification/${userId}`, data);

  return response.data.data;
};

export const getVerificationMetadata =
  async (): Promise<VerificationMetadata> => {
    const response = await fetch(`${backendUrl}/api/verification/metadata`, {
      method: "GET",
      credentials: "include",
    });

    return parseResponse<VerificationMetadata>(response);
  };

export const getVerificationFeeQuote = async (payload: {
  userId: string;
  categoryCode: string;
  stateCode: string;
  metric: string;
}): Promise<VerificationFeeQuote> => {
  const response = await fetch(`${backendUrl}/api/verification/fee-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<VerificationFeeQuote>(response);
};

// Socket part

const getSocketUrl = (): string => {
  return backendUrl.replace(/\/+$/, "");
};

const createVerificationSocket = (): Socket => {
  return io(getSocketUrl(), {
    transports: ["websocket"],
    withCredentials: true,
  });
};

export const uploadVerificationDocuments = async (
  manufacturerInvoice: File | null,
  previousCertificate: File | null,
): Promise<UploadVerificationDocumentsResponse> => {
  const formData = new FormData();

  if (manufacturerInvoice) {
    formData.append("manufacturerFile", manufacturerInvoice);
  }

  if (previousCertificate) {
    formData.append("prevCertificateFile", previousCertificate);
  }

  const myNewAppId = `APP-${Date.now()}`;
  formData.append("applicationId", myNewAppId);

  const response = await fetch(`${backendUrl}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const result = await response.json();

  if (result.success === false) {
    throw new Error(result.message || "Upload failed");
  }

  return result as UploadVerificationDocumentsResponse;
};

export const createVerificationApplication = (
  payload: CreateVerificationApplicationPayload,
): Promise<CreateVerificationApplicationResponse> => {
  return new Promise((resolve, reject) => {
    const socket = createVerificationSocket();

    let settled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.disconnect();
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    socket.on("connect", () => {
      console.log("[VERIFICATION] Socket connected:", socket.id);

      socket.emit("data", {
        ...payload,
        manufacturerFileUrl: payload.manufacturerFileUrl ?? null,
        prevCertificateFileUrl: payload.prevCertificateFileUrl ?? null,
      });
    });

    socket.on(
      "verification_persisted",
      (data: VerificationPersistenceResponse) => {
        if (settled) {
          return;
        }

        if (!data?.success) {
          fail(new Error("Verification application persistence failed."));
          return;
        }

        settled = true;
        cleanup();

        resolve({
          applicationId: data.applicationId,
          applicationNo: data.applicationNo,
          instrumentId: data.instrumentId,
          workflowStatus: "SUBMITTED",
          applicationType: payload.appType,

          payment: {
            receiptId: "",
            receiptNo: "",
            transactionId: null,
            paymentMethod: payload.paymentMethod,
            paymentStatus: "PENDING",
            totalAmount: 0,
          },

          category: {
            categoryId: "",
            categoryCode: payload.categoryCode,
            categoryName: "",
            accuracyClass: "",
          },

          state: {
            stateId: "",
            stateCode: payload.stateCode,
            stateName: "",
          },

          fee: {
            statutoryFee: 0,
            additionalFee: 0,
            totalAmount: 0,
            feeBasis: "",
            condition: null,
            maximumFee: null,
          },
        });
      },
    );

    socket.on(
      "verification_persistence_failed",
      (data: { success?: boolean; message?: string }) => {
        fail(
          new Error(
            data?.message || "Failed to create verification application.",
          ),
        );
      },
    );

    socket.on("connect_error", (error) => {
      console.error("[VERIFICATION] Socket connection error:", error);

      fail(new Error("Unable to connect to verification server."));
    });

    socket.on("disconnect", (reason) => {
      console.log("[VERIFICATION] Socket disconnected:", reason);

      if (!settled) {
        fail(
          new Error(
            "Verification socket disconnected before the application was saved.",
          ),
        );
      }
    });
  });
};
