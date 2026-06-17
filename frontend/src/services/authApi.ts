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
      queryFn: async ({ email, password }) => {
        // 1. Try to find the user in local storage employees
        let user: User | null = null;

        const rawEmployees = localStorage.getItem("hrms-employees");
        if (rawEmployees) {
          try {
            const data = JSON.parse(rawEmployees);
            const employeeList = data.employees || [];
            const accountsList = data.userAccounts || [];
            
            const foundEmp = employeeList.find((e: any) => e.email.toLowerCase() === email.toLowerCase());
            if (foundEmp) {
              const foundAcc = accountsList.find((a: any) => a.employee_id === foundEmp.employee_id);
              if (foundAcc && foundAcc.is_active) {
                // Check if password matches password_hash
                if (foundAcc.password_hash === password) {
                  user = {
                    id: foundEmp.employee_id,
                    name: `${foundEmp.first_name} ${foundEmp.last_name}`,
                    email: foundEmp.email,
                    role: foundAcc.role,
                    department: foundEmp.department,
                    designation: foundEmp.designation,
                    manager: foundEmp.manager_id,
                    status: foundEmp.status === "active" ? "active" : "inactive",
                    must_change_password: foundAcc.must_change_password
                  };
                }
              }
            }
          } catch (err) {
            console.error("Failed to parse hrms-employees in login", err);
          }
        }

        // 2. Fallback to demoUsers
        if (!user) {
          const demoUser = demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());
          if (demoUser) {
            // Check if password is "password" (the default for demo users inLoginPage)
            if (password === "password" || password === "") {
              user = {
                ...demoUser,
                must_change_password: false
              };
            }
          }
        }

        if (!user) {
          return { error: { status: 401, data: "Invalid credentials." } };
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
