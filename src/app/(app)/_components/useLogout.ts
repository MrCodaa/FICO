"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@/lib/http/apiClient";

/** Odjava iz menija "Moj nalog" i iz footera: briše cookie i keš, vraća na landing. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });
}
