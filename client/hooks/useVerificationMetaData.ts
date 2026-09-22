import {
  getVerificationMetadata,
  VerificationMetadata,
} from "@/services/business/verificationApp.service";
import { useEffect, useState } from "react";

export const useVerificationMetadata = () => {
  const [data, setData] = useState<VerificationMetadata | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getVerificationMetadata();

        if (!mounted) {
          return;
        }

        setData(result);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load metadata",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
  };
};
