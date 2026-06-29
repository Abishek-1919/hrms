import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "@hrms/shared-types";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ChangePasswordRequest {
  accessToken: string;
  newPassword: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      })
    }),
    changePassword: builder.mutation<{ success: boolean; must_change_password: boolean }, ChangePasswordRequest>({
      query: ({ accessToken, newPassword }) => ({
        url: "/auth/change-password",
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        body: { newPassword }
      })
    })
  })
});

export const { useLoginMutation, useChangePasswordMutation } = authApi;
