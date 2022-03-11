import { FieldError } from "src/resolvers/FieldError";
import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (
  options: UsernamePasswordInput
): [FieldError] | null => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Email is not valid.",
      },
    ];
  }
  if (options.username.length <= 5) {
    return [
      {
        field: "username",
        message: "Username must be at least 6 charactors.",
      },
    ];
  }

  if (options.password.length <= 5) {
    return [
      {
        field: "password",
        message: "Password must be at least 6 charactors.",
      },
    ];
  }

  return null;
};
