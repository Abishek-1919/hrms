const bcrypt = require("bcryptjs");

const users = [
  ["employee@methodhub.com", "Employee@methodhub"],
  ["manager@methodhub.com", "Manager@methodhub"],
  ["admin@methodhub.com", "Admin@methodhub"],
  ["hr@methodhub.com", "HR@methodhub"],
  ["stakeholder@methodhub.com", "Stakeholder@methodhub"],
];

for (const [email, password] of users) {
  const hash = bcrypt.hashSync(password, 10);
  console.log(
    `update user_accounts set password_hash = '${hash}', must_change_password = false, is_active = true, updated_at = now() where email = '${email}';`
  );
}
