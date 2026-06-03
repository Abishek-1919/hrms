import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Role, User } from "@hrms/shared-types";
import { demoUsers } from "@/services/mockData";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: async ({ email }) => {
        const roleFromEmail = email.split("@")[0] as Role;
        const user = demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

        if (!user || !["employee", "manager", "admin"].includes(roleFromEmail)) {
          return { error: { status: 401, data: "Invalid demo credentials" } };
        }

        return {
          data: {
            user,
            accessToken: `demo-access-token-${user.role}`,
            refreshToken: `demo-refresh-token-${user.role}`
          }
        };
      }
    })
  })
});

export const { useLoginMutation } = authApi;
