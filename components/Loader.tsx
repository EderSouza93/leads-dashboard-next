"use client";
import { useEffect, useState } from "react";
import { SyncLoader } from "react-spinners";

export default function Loading() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-transparent bg-opacity-50 backdrop-blur-sm">
        <SyncLoader color="#031A7C" size={10} />
      </div>
    );
  }

  return null;
}
